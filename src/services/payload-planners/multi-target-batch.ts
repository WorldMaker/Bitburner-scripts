import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { groupBy } from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { orderByDescending } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { App } from '../../models/app'
import {
	Batch,
	BatchPlans,
	BatchTick,
	BatchType,
	createBatch,
	getNextBatchType,
} from '../../models/batch'
import { Logger } from '../../models/logger'
import {
	DeployPlan,
	PayloadPlan,
	PayloadPlanner,
} from '../../models/payload-plan'
import { Target, TargetDirection } from '../../models/target'
import {
	AppCacheService,
	BatchPayloadG,
	BatchPayloadH,
	BatchPayloadW,
} from '../app-cache'
import { TargetService } from '../target'

const { from } = IterableX

const TotalBatchesPerTargetToPlan = 10
const TotalTimeWindowToPlan = 5 /* min */ * 60 /* sec */ * 1000 /* ms */

export class BatchAppSelector {
	protected payloadG: App
	protected payloadH: App
	protected payloadW: App

	constructor(apps: AppCacheService) {
		this.payloadG = apps.getApp(BatchPayloadG)
		this.payloadH = apps.getApp(BatchPayloadH)
		this.payloadW = apps.getApp(BatchPayloadW)
	}

	selectApp(direction: TargetDirection) {
		switch (direction) {
			case 'weaken':
				return this.payloadW
			case 'grow':
				return this.payloadG
			case 'hack':
				return this.payloadH
		}
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

interface NeedsBatches {
	target: Target
	batch: BatchPlans
	start: Date
}

function getBatchDeployments(
	apps: BatchAppSelector,
	target: Target,
	plan: BatchPlans,
	start: Date
) {
	const deploys: DeployPlan[] = plan.plans.map((p) => ({
		app: apps.selectApp(p.direction),
		target,
		threads: p.threads,
		batch: plan,
		batchStart: start,
	}))
	return {
		totalRam: deploys.reduce(
			(acc, cur) => acc + cur.app.ramCost * cur.threads,
			0
		),
		deploys,
	}
}

export class MultiTargetBatchPlanner implements PayloadPlanner {
	private appSelector: BatchAppSelector
	private totalRam = 0
	private freeRam = 0
	private satisfiedTargets = 0
	private attackedTargets = 0

	constructor(
		private ns: NS,
		private logger: Logger,
		private targetService: TargetService,
		apps: AppCacheService
	) {
		this.appSelector = new BatchAppSelector(apps)
	}

	summarize(): string {
		const ramPercent = this.freeRam / this.totalRam
		return `INFO batch attacking ${this.satisfiedTargets}/${
			this.attackedTargets
		}/${
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

		const processesByTarget = new Map(
			from(allProcesses).pipe(
				// all current batch payloads are ["batch", target, ...]
				groupBy((process) => process.process.args[1]?.toString()),
				map((group) => [group.key, group])
			)
		)

		const needsBatches: NeedsBatches[] = []
		const killProcesses = new Map<string, ProcessInfo[]>()
		const player = this.ns.getPlayer()
		const now = new Date().getTime()
		const nextBatchTick = new Date(now + BatchTick)

		for (const target of targets) {
			const targetProcesses = processesByTarget.get(target.name)
			if (!targetProcesses) {
				const server = target.getServer()
				needsBatches.push({
					target,
					batch: createBatch(
						this.ns,
						getNextBatchType(
							target,
							server.moneyAvailable,
							server.hackDifficulty
						),
						player,
						target.getServer()
					).plan(server.moneyAvailable, server.hackDifficulty),
					start: nextBatchTick,
				})
			} else {
				const batches = targetProcesses.pipe(
					// ['batch', target, start, end, type, batchId]
					groupBy(
						(process) => process.process.args[5]?.toString() ?? 'unknown'
					),
					map((group) => {
						// TODO: Composite processes by [payload, start]
						const processes = [...group]
						const batchType = processes[0].process.args[4]?.toString() as
							| BatchType
							| undefined
						return createBatch(
							this.ns,
							batchType ?? 'bad',
							player,
							target.getServer(),
							processes.map(({ process }) => process)
						)
					})
				)

				let safeBatchCount = 0
				let lastBatchEnd = 0
				let lastBatch: Batch<any> | null = null
				for (const batch of batches) {
					if (!batch.isSafe()) {
						this.logger.log(`WARN desync ${target.name}`)
						let killlist = killProcesses.get(target.name) ?? []
						killlist = killlist.concat(...batch.getProcesses()!)
						killProcesses.set(target.name, killlist)
					} else {
						safeBatchCount++
						const batchEnd = batch.getEndTime()
						if (batchEnd && batchEnd > lastBatchEnd) {
							lastBatchEnd = batchEnd
							lastBatch = batch
						}
					}
				}

				if (safeBatchCount > 0) {
					this.attackedTargets++
				}

				if (
					safeBatchCount >= TotalBatchesPerTargetToPlan ||
					lastBatchEnd >= now + TotalTimeWindowToPlan
				) {
					this.satisfiedTargets++
				} else {
					const server = target.getServer()
					if (lastBatch?.isStableHack()) {
						const plan = createBatch(
							this.ns,
							getNextBatchType(
								target,
								server.moneyMax,
								server.minDifficulty,
								lastBatch
							),
							player,
							server
						).plan(server.moneyMax, server.minDifficulty)
						const start = new Date(
							Math.max(
								nextBatchTick.getTime(),
								lastBatch.getStartTime()! + plan.end + BatchTick * plan.endTicks
							)
						)
						needsBatches.push({
							target,
							batch: plan,
							start,
						})
					} else {
						const start = new Date(
							Math.max(
								nextBatchTick.getTime(),
								lastBatch?.getEndTime() ?? 0 + BatchTick
							)
						)
						const expectedGrowth = lastBatch?.expectedGrowth() ?? 0
						needsBatches.push({
							target,
							batch: createBatch(
								this.ns,
								getNextBatchType(
									target,
									server.moneyAvailable * expectedGrowth,
									server.minDifficulty
								),
								player,
								server
							).plan(
								server.moneyAvailable * expectedGrowth,
								server.minDifficulty
							),
							start,
						})
					}
					processesByTarget.delete(target.name)
				}
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
		for (const { target, batch, start } of needsBatches) {
			let nextfreelist: FreeRam[] = []
			let attacked = false
			const batchDeployments = getBatchDeployments(
				this.appSelector,
				target,
				batch,
				start
			)

			for (const { server, available } of curfreelist) {
				// TODO: Support for splitting batches across multiple servers
				if (attacked) {
					nextfreelist.push({ server, available })
					continue
				}
				if (available < batchDeployments.totalRam) {
					nextfreelist.push({ server, available })
					// when sorting these we could break here, but we want to track all free RAM
					continue
				}
				if (start.getTime() + batch.end >= now + TotalTimeWindowToPlan) {
					this.satisfiedTargets++
				}
				let serverDeployments = deployments.get(server.name) ?? []
				serverDeployments = serverDeployments.concat(
					...batchDeployments.deploys
				)
				deployments.set(server.name, serverDeployments)
				const remainingAvailable = available - batchDeployments.totalRam
				if (remainingAvailable > 0) {
					nextfreelist.push({ server, available: remainingAvailable })
				}
				attacked = true
			}

			if (attacked) {
				this.attackedTargets++
			}

			curfreelist = from(nextfreelist).pipe(
				orderByDescending((f) => f.available)
			)
		}

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
