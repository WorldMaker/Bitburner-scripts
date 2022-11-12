import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { concatWith } from '@reactivex/ix-esnext-esm/iterable/operators/concatwith'
import { groupBy } from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { orderByDescending } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { repeat } from '@reactivex/ix-esnext-esm/iterable/operators/repeat'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { zip } from '@reactivex/ix-esnext-esm/iterable/zip'
import { App } from '../../models/app'
import {
	DeployPlan,
	PayloadPlan,
	PayloadPlanner,
} from '../../models/payload-plan'
import { Target, TargetDirection } from '../../models/target'
import {
	AppCacheService,
	PayloadAll,
	SalvoPayloadG,
	SalvoPayloadH,
	SalvoPayloadW,
} from '../app-cache'
import { TargetService } from '../target'

const { from } = IterableX

const GrowthSecurityRaisePerThread = 0.004
const WeakenSecurityLowerPerThread = 0.05
const DesiredHackingSkim = 0.25

export class SalvoAppSelector {
	protected payloadAll: App
	protected payloadG: App
	protected payloadH: App
	protected payloadW: App

	constructor(apps: AppCacheService) {
		this.payloadAll = apps.getApp(PayloadAll)
		this.payloadG = apps.getApp(SalvoPayloadG)
		this.payloadH = apps.getApp(SalvoPayloadH)
		this.payloadW = apps.getApp(SalvoPayloadW)
	}

	selectApp(direction: TargetDirection | 'all') {
		switch (direction) {
			case 'weaken':
				return this.payloadW
			case 'grow':
				return this.payloadG
			case 'hack':
				return this.payloadH
			default:
				return this.payloadAll
		}
	}
}

function areThreadsSufficient(
	ns: NS,
	player: Player,
	target: Target,
	threads: number
) {
	const server = ns.getServer(target.name)
	switch (target.getTargetDirection()) {
		case 'grow':
			const moneyAvailable = target.checkMoneyAvailable()
			const targetGrowPercent =
				moneyAvailable / (target.getWorth() - moneyAvailable)
			const growPercent = ns.formulas.hacking.growPercent(
				server,
				threads,
				player
			)
			if (growPercent >= targetGrowPercent) {
				return true
			}
			return false
		case 'weaken':
			const securityDesired =
				target.checkSecurityLevel() - target.getMinSecurityLevel()
			const desiredThreads = securityDesired / WeakenSecurityLowerPerThread
			if (threads >= desiredThreads) {
				return true
			}
			return false
		case 'hack':
			const hackPercent =
				ns.formulas.hacking.hackPercent(server, player) * threads
			if (hackPercent >= DesiredHackingSkim) {
				return true
			}
			return false
		default:
			return false
	}
}

function calculateTargetThreads(
	ns: NS,
	player: Player,
	target: Target,
	app: App,
	ramBudget: number
) {
	const server = ns.getServer(target.name)
	switch (target.getTargetDirection()) {
		case 'grow':
			const moneyAvailable = target.checkMoneyAvailable()
			const targetGrowPercent =
				moneyAvailable / (target.getWorth() - moneyAvailable)
			const securityAvailable =
				target.getSecurityThreshold() - target.checkSecurityLevel()
			const totalPossibleGrowThreads = Math.min(
				ramBudget / app.ramCost,
				securityAvailable / GrowthSecurityRaisePerThread
			)
			if (targetGrowPercent <= 1) {
				return 1
			}
			return Math.min(
				totalPossibleGrowThreads,
				Math.ceil(ns.growthAnalyze(target.name, targetGrowPercent))
			)
		case 'weaken':
			const securityDesired =
				target.checkSecurityLevel() - target.getMinSecurityLevel()
			const totalPossibleWeakenThreads = Math.floor(ramBudget / app.ramCost)
			return Math.max(
				1,
				Math.min(
					Math.ceil(securityDesired / WeakenSecurityLowerPerThread),
					totalPossibleWeakenThreads
				)
			)
		case 'hack':
			const hackPercent = ns.formulas.hacking.hackPercent(server, player)
			const totalPossibleHackThreads = Math.floor(ramBudget / app.ramCost)
			return Math.max(
				1,
				Math.min(
					Math.ceil(DesiredHackingSkim / hackPercent),
					totalPossibleHackThreads
				)
			)
		default:
			return 0
	}
}

interface FreeRam {
	server: Target
	available: number
}

interface RunningProcess {
	server: Target
	process: ProcessInfo
}

interface ThreadsNeeded {
	target: Target
	app: App
	threads: number
}

export class MultiTargetDirectionalFormulatedPlanner implements PayloadPlanner {
	private appSelector: SalvoAppSelector
	private totalRam = 0
	private freeRam = 0
	private satisfiedTargets = 0
	private attackedTargets = 0

	constructor(
		private ns: NS,
		private targetService: TargetService,
		apps: AppCacheService
	) {
		this.appSelector = new SalvoAppSelector(apps)
	}

	summarize(): string {
		const ramPercent = this.freeRam / this.totalRam
		return `INFO attacking ${this.satisfiedTargets}/${this.attackedTargets}/${
			this.targetService.getTargets().length
		} targets; RAM ${ramPercent.toLocaleString(undefined, {
			style: 'percent',
		})} free of ${this.totalRam}`
	}

	*plan(rooted: Iterable<Target>): Iterable<PayloadPlan> {
		this.totalRam = 0
		this.freeRam = 0
		this.satisfiedTargets = 0
		this.attackedTargets = 0

		const targets = this.targetService.getTargets()

		const servers = from(rooted).pipe(
			map((server) => ({
				server,
				available: server.getMaxRam() - server.checkUsedRam(),
			})),
			orderByDescending((server) => server.available)
		)

		const freelist: FreeRam[] = []
		const allProcesses: RunningProcess[] = []
		const serversToDeploy: Target[] = []

		// *** Assess what is currently running ***

		for (const free of servers) {
			const { server } = free
			this.totalRam += server.getMaxRam()
			if (server.getMaxRam() === 0) {
				continue
			}
			serversToDeploy.push(server)
			if (free.available > 0) {
				freelist.push(free)
			}
			const processes = this.ns.ps(server.name)
			for (const process of processes) {
				allProcesses.push({ server, process })
			}
		}

		const player = this.ns.getPlayer()

		const processesByTarget = new Map(
			from(allProcesses).pipe(
				// all current payloads are ["start", target, ...]
				groupBy((process) => process.process.args[1]?.toString()),
				map((group) => [group.key, group])
			)
		)

		const needsThreads: ThreadsNeeded[] = []
		const killProcesses = new Map<string, ProcessInfo[]>()

		for (const target of targets) {
			target.updateTargetDirection()
			const app = this.appSelector.selectApp(target.getTargetDirection())
			const targetProcesses = processesByTarget.get(target.name)
			// ideal number of threads up to 100% of total RAM
			const targetThreads = calculateTargetThreads(
				this.ns,
				player,
				target,
				app,
				this.totalRam
			)
			if (!targetProcesses) {
				needsThreads.push({ target, app, threads: targetThreads })
			} else {
				const processesByApp = new Map(
					targetProcesses.pipe(
						groupBy((process) => process.process.filename),
						map((group) => [group.key, group])
					)
				)
				const appProcesses = processesByApp.get(app.name)
				if (!appProcesses) {
					needsThreads.push({ target, app, threads: targetThreads })
				} else {
					const appThreads = reduce(
						appProcesses,
						(acc, cur) => acc + cur.process.threads,
						0
					)
					if (areThreadsSufficient(this.ns, player, target, appThreads)) {
						this.satisfiedTargets++
					} else {
						needsThreads.push({
							target,
							app,
							threads: targetThreads - appThreads,
						})
					}
					processesByApp.delete(app.name)
				}

				for (const processes of processesByApp.values()) {
					for (const { server, process } of processes) {
						const killlist = killProcesses.get(server.name) ?? []
						killlist.push(process)
						killProcesses.set(server.name, killlist)
					}
				}
				processesByTarget.delete(target.name)
			}
		}

		for (const processes of processesByTarget.values()) {
			for (const { server, process } of processes) {
				const killlist = killProcesses.get(server.name) ?? []
				killlist.push(process)
				killProcesses.set(server.name, killlist)
			}
		}

		// *** Use freelist to find new deployments ***

		this.attackedTargets = this.satisfiedTargets

		const deployments = new Map<string, DeployPlan>()
		for (const [free, targetRequest] of zip(
			freelist,
			from(needsThreads).pipe(concatWith(from([null]).pipe(repeat())))
		)) {
			if (targetRequest == null) {
				this.freeRam += free.available
				continue
			}
			const { target, app, threads: targetThreads } = targetRequest
			if (free.available < app.ramCost) {
				continue
			}
			const threads = Math.min(
				Math.floor(free.available / app.ramCost),
				targetThreads
			)
			if (threads === targetThreads) {
				this.satisfiedTargets++
			}
			deployments.set(free.server.name, {
				app,
				target,
				threads,
			})
			this.attackedTargets++
			this.freeRam += free.available - threads * app.ramCost
		}

		// *** Merge kills and deployments to yield current plans ***

		for (const server of serversToDeploy) {
			const kills = killProcesses.get(server.name)
			const deploy = deployments.get(server.name)
			if (!kills && !deploy) {
				yield {
					type: 'existing',
					server,
				}
				continue
			}
			yield {
				type: 'change',
				deployments: [...(deploy ? [deploy] : [])],
				kills,
				killall: false,
				server,
			}
		}
	}
}
