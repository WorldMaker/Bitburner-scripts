import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { groupBy } from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import {
	orderByDescending,
	thenBy,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { App } from '../../models/app'
import { Logger } from '../../models/logger'
import {
	DeployPlan,
	KillPlan,
	PayloadPlan,
	PayloadPlanner,
} from '../../models/payload-plan'
import { Target, TargetDirection } from '../../models/target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'
import { SingleTargetAppSelector } from './single-target-directional-payload'

const { from } = IterableX

const GrowthSecurityRaisePerThread = 0.004
const WeakenSecurityLowerPerThread = 0.05
const DesiredHackingSkim = 0.25

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
				(target.getMaxRam() - moneyAvailable) / moneyAvailable
			const securityAvailable =
				target.getSecurityThreshold() - target.checkSecurityLevel()
			const totalPossibleGrowThreads = Math.min(
				ramBudget / app.ramCost,
				securityAvailable / GrowthSecurityRaisePerThread
			)
			for (let threads = 1; threads <= totalPossibleGrowThreads; threads++) {
				const growPercent = ns.formulas.hacking.growPercent(
					server,
					threads,
					player
				)
				if (growPercent >= targetGrowPercent) {
					return threads
				}
			}
			return totalPossibleGrowThreads
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

export class MultiTargetDirectionalFormulatedPlanner implements PayloadPlanner {
	private appSelector: SingleTargetAppSelector
	private targetNumber = 0
	private threads = 0
	private ramBudget = 0

	constructor(
		private ns: NS,
		private logger: Logger,
		private targetService: TargetService,
		apps: AppCacheService
	) {
		this.appSelector = new SingleTargetAppSelector(apps)
	}

	summarize(): string {
		return `INFO attacking ${this.targetNumber + 1} / ${
			this.targetService.getTargets().length
		} targets; ${this.ramBudget} free; ${this.threads} needed threads`
	}

	*plan(rooted: Iterable<Target>): Iterable<PayloadPlan> {
		const targets = this.targetService.getTargets()

		const servers = from(rooted).pipe(
			orderByDescending((server) => server.getMaxRam()),
			thenBy((server) => server.name)
		)

		this.ramBudget = reduce(
			servers,
			(total, current) => total + current.getMaxRam(),
			0
		)

		const player = this.ns.getPlayer()

		this.targetNumber = 0
		let target = targets[this.targetNumber]
		let app = this.appSelector.selectApp(target.getTargetDirection())
		this.threads = calculateTargetThreads(
			this.ns,
			player,
			target,
			app,
			this.ramBudget
		)

		for (const server of servers) {
			if (server.isSlow) {
				app = this.appSelector.selectApp('all')
				this.ramBudget -= server.getMaxRam()
				if (server.getMaxRam() < app.ramCost) {
					this.logger.log(
						`WARN ${server.name} only has ${server.getMaxRam()} memory`
					)
					continue
				}
				if (server.isRunning(app.name, ...app.getArgs(target))) {
					yield {
						type: 'existing',
						server,
					}
					continue
				}
				const threads = Math.floor(server.getMaxRam() / app.ramCost)
				yield {
					type: 'change',
					server,
					killall: true,
					deployments: [
						{
							target,
							app,
							threads,
						},
					],
				}
				continue
			}

			const expectedDeployments = new Map<string, Map<string, DeployPlan>>()
			let ram = server.getMaxRam()
			while (this.targetNumber < targets.length && ram > 0) {
				if (this.threads <= 0) {
					this.targetNumber++
					if (this.targetNumber == targets.length) {
						break
					}
					target = targets[this.targetNumber]
					app = this.appSelector.selectApp(target.getTargetDirection())
					this.threads = calculateTargetThreads(
						this.ns,
						player,
						target,
						app,
						this.ramBudget
					)
					if (this.threads <= 0) {
						continue
					}
				}
				if (!expectedDeployments.has(app.name)) {
					expectedDeployments.set(app.name, new Map())
				}
				const availableThreads = Math.min(
					this.threads,
					Math.floor(ram / app.ramCost)
				)
				expectedDeployments.get(app.name)!.set(target.name, {
					app,
					target,
					threads: availableThreads,
				})
				this.threads -= availableThreads
				ram -= availableThreads * app.ramCost
			}

			const processes = from(this.ns.ps(target.name)).pipe(
				groupBy((process) => process.filename)
			)

			const kills: KillPlan[] = []
			const deployments: DeployPlan[] = []
			const unseen = new Set(expectedDeployments.keys())
			for (const group of processes) {
				unseen.delete(group.key)
				const appdeployments = expectedDeployments.get(group.key)
				if (!appdeployments) {
					for (const process of group) {
						kills.push(process)
					}
					continue
				}
				const unseenTargets = new Set(appdeployments.keys())
				const targets = group.pipe(
					// all current payloads are ["start", target, ...]
					groupBy((process) => process.args[1]?.toString())
				)
				for (const targetProcesses of targets) {
					unseenTargets.delete(targetProcesses.key)
					if (!appdeployments.has(targetProcesses.key)) {
						for (const process of targetProcesses) {
							kills.push(process)
						}
					}
					const targetdeployment = appdeployments.get(targetProcesses.key)!
					const totalThreads = reduce(
						targetProcesses,
						(acc, cur) => acc + cur.threads,
						0
					)
					if (totalThreads !== targetdeployment.threads) {
						for (const process of targetProcesses) {
							kills.push(process)
						}
						deployments.push(targetdeployment)
					}
				}
				for (const unseenTarget of unseenTargets) {
					deployments.push(appdeployments.get(unseenTarget)!)
				}
			}
			for (const unseenApp of unseen) {
				for (const deployment of expectedDeployments.get(unseenApp)!.values()) {
					deployments.push(deployment)
				}
			}

			if (kills.length <= 0 && deployments.length <= 0) {
				yield {
					type: 'existing',
					server,
				}
				continue
			}

			yield {
				type: 'change',
				server,
				kills,
				killall: false,
				deployments,
			}
		}
	}
}
