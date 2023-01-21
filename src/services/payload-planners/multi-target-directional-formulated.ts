import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { groupBy } from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { orderByDescending } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { NsLogger } from '../../logging/logger'
import {
	App,
	PayloadAll,
	SalvoPayloadG,
	SalvoPayloadH,
	SalvoPayloadW,
} from '../../models/app'
import {
	calculateGrowThreads,
	DesiredHackingSkim,
	GrowthSecurityRaisePerThread,
	WeakenSecurityLowerPerThread,
} from '../../models/hackmath'
import {
	DeployPlan,
	PayloadPlan,
	PayloadPlanner,
} from '../../models/payload-plan'
import { Target, TargetDirection } from '../../models/target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'

const { from } = IterableX

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

function areThreadsSufficient(ns: NS, target: Target, threads: number) {
	switch (target.getTargetDirection()) {
		case 'grow':
			{
				const moneyAvailable = target.checkMoneyAvailable()
				const targetGrowPercent = Math.max(
					1,
					moneyAvailable / (target.getWorth() - moneyAvailable)
				)
				const targetThreads = ns.growthAnalyze(target.name, targetGrowPercent)
				if (threads >= targetThreads) {
					return true
				}
			}
			return false
		case 'weaken':
			{
				const securityDesired =
					target.checkSecurityLevel() - target.getMinSecurityLevel()
				const desiredThreads = securityDesired / WeakenSecurityLowerPerThread
				if (threads >= desiredThreads) {
					return true
				}
			}
			return false
		case 'hack':
			{
				const hackPercent = ns.hackAnalyze(target.name) * threads
				const desiredMoney =
					target.checkMoneyAvailable() - target.getMoneyThreshold()
				const desiredHackPercent = desiredMoney / target.getWorth()
				if (
					hackPercent >= DesiredHackingSkim ||
					hackPercent >= desiredHackPercent
				) {
					return true
				}
			}
			return false
		default:
			return false
	}
}

function calculateTargetThreads(
	ns: NS,
	target: Target,
	app: App,
	ramBudget: number
) {
	const formulasExist = ns.fileExists('Formulas.exe')
	switch (target.getTargetDirection()) {
		case 'grow': {
			const moneyAvailable = target.checkMoneyAvailable()
			const targetGrowPercent =
				moneyAvailable / (target.getWorth() - moneyAvailable)
			const securityAvailable =
				target.getSecurityThreshold() - target.checkSecurityLevel()
			const totalPossibleGrowThreads = Math.floor(
				Math.min(
					ramBudget / app.ramCost,
					securityAvailable / GrowthSecurityRaisePerThread
				)
			)
			if (formulasExist) {
				const player = ns.getPlayer()
				const server = ns.getServer(target.name)
				return Math.min(
					totalPossibleGrowThreads,
					calculateGrowThreads(ns.formulas.hacking, server, player)
				)
			}
			if (targetGrowPercent < 1) {
				const growthThreads = ns.growthAnalyze(
					target.name,
					1 + targetGrowPercent
				)
				return Math.max(
					1,
					Math.min(totalPossibleGrowThreads, Math.ceil(growthThreads))
				)
			}
			return Math.max(
				1,
				Math.min(
					totalPossibleGrowThreads,
					Math.ceil(ns.growthAnalyze(target.name, targetGrowPercent))
				)
			)
		}
		case 'weaken': {
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
		}
		case 'hack': {
			const hackPercent = ns.hackAnalyze(target.name)
			const totalPossibleHackThreads = Math.floor(ramBudget / app.ramCost)
			const desiredMoney =
				target.checkMoneyAvailable() - target.getMoneyThreshold()
			const desiredHackPercent = desiredMoney / target.getWorth()
			return Math.max(
				1,
				Math.min(
					Math.ceil(
						Math.min(DesiredHackingSkim, desiredHackPercent) / hackPercent
					),
					totalPossibleHackThreads
				)
			)
		}
		default:
			return 0
	}
}

interface FreeRam {
	server: Target
	available: number
	running: Set<string>
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
	private readonly appSelector: SalvoAppSelector
	private totalRam = 0
	private freeRam = 0
	private satisfiedTargets = 0
	private attackedTargets = 0

	constructor(
		private readonly ns: NS,
		private readonly logger: NsLogger,
		private readonly targetService: TargetService,
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
				running: new Set<string>(),
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
				// pipe delimit process and target
				free.running.add(`${process.filename}|${process.args[1]}`)
				allProcesses.push({ server, process })
			}
		}

		const processesByTarget = new Map(
			from(allProcesses).pipe(
				// all current payloads are ["start", target, ...]
				groupBy((process) => process.process.args[1]?.toString()),
				map((group) => [group.key, group])
			)
		)

		const needsThreads: ThreadsNeeded[] = []
		const killProcesses = new Map<string, ProcessInfo[]>()
		const satisfied = new Set<string>()
		const attackedSet = new Set<string>()

		for (const target of targets) {
			target.updateTargetDirection()
			const app = this.appSelector.selectApp(target.getTargetDirection())
			const targetProcesses = processesByTarget.get(target.name)
			// ideal number of threads up to 100% of total RAM
			const targetThreads = calculateTargetThreads(
				this.ns,
				target,
				app,
				this.totalRam
			)

			if (!targetProcesses) {
				if (targetThreads >= 1) {
					needsThreads.push({ target, app, threads: targetThreads })
					this.logger.debug`${
						target.name
					}\t❌ ${0}/${targetThreads} ${target.getTargetDirection()}`
				} else {
					this.logger.warn`${
						target.name
					}\t❓ ${0} threads needed for ${target.getTargetDirection()}`
				}
			} else {
				const processesByApp = new Map(
					targetProcesses.pipe(
						groupBy((process) => process.process.filename),
						map((group) => [group.key, group])
					)
				)
				const appProcesses = processesByApp.get(app.name)
				if (!appProcesses) {
					if (targetThreads >= 1) {
						needsThreads.push({ target, app, threads: targetThreads })
						this.logger.debug`${
							target.name
						}\t❌ ${0}/${targetThreads} ${target.getTargetDirection()}`
					}
				} else {
					const appThreads = reduce(
						appProcesses,
						(acc, cur) => acc + cur.process.threads,
						0
					)
					attackedSet.add(target.name)
					if (areThreadsSufficient(this.ns, target, appThreads)) {
						satisfied.add(target.name)
						this.logger.debug`${
							target.name
						}\t✔ ${targetThreads}/${targetThreads} ${target.getTargetDirection()}`
					} else {
						this.logger.debug`${
							target.name
						}\t❌ ${appThreads}/${targetThreads} ${target.getTargetDirection()}`
						const threadsNeeded = Math.ceil(targetThreads - appThreads)
						if (threadsNeeded >= 1) {
							needsThreads.push({
								target,
								app,
								threads: threadsNeeded,
							})
						}
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

		const deployments = new Map<string, DeployPlan[]>()
		let curfreelist = from(freelist)
		for (const { target, app, threads: targetThreads } of needsThreads) {
			let needFulfilled = targetThreads
			const nextfreelist: FreeRam[] = []
			let attacked = false

			for (const { server, available, running } of curfreelist) {
				if (running.has(`${app.name}|${target.name}`)) {
					nextfreelist.push({ server, available, running })
					continue
				}
				if (needFulfilled <= 0) {
					nextfreelist.push({ server, available, running })
					continue
				}
				if (available < app.ramCost) {
					nextfreelist.push({ server, available, running })
					// when sorting these we could break here, but we want to track all free RAM
					continue
				}
				const threads = Math.min(
					Math.floor(available / app.ramCost),
					needFulfilled
				)
				if (threads < 1) {
					nextfreelist.push({ server, available, running })
					continue
				}
				needFulfilled -= threads
				if (needFulfilled <= 0) {
					satisfied.add(target.name)
				}
				const serverDeployments = deployments.get(server.name) ?? []
				serverDeployments.push({
					app,
					target,
					threads,
				})
				deployments.set(server.name, serverDeployments)
				running.add(`${app.name}|${target.name}`)
				const remainingAvailable = available - threads * app.ramCost
				if (remainingAvailable > 0) {
					nextfreelist.push({ server, available: remainingAvailable, running })
				}
				attacked = true
			}

			if (attacked) {
				attackedSet.add(target.name)
			}

			curfreelist = from(nextfreelist).pipe(
				orderByDescending((f) => f.available)
			)
		}

		this.satisfiedTargets = satisfied.size
		this.attackedTargets = attackedSet.size
		this.freeRam += reduce(curfreelist, (acc, cur) => acc + cur.available, 0)

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
				deployments: [...(deploy ? deploy : [])],
				kills,
				killall: false,
				server,
			}
		}
	}
}
