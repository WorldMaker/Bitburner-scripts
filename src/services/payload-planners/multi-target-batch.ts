import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { groupBy } from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { orderByDescending } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import {
	App,
	BatchPayloadG,
	BatchPayloadH,
	BatchPayloadW,
} from '../../models/app'
import {
	Batch,
	BatchPlans,
	BatchTick,
	BatchType,
	createBatch,
	getNextBatchType,
} from '../../models/batch'
import { NsLogger } from '../../logging/logger'
import { RunningProcess } from '../../models/memory'
import {
	DeployPlan,
	PayloadPlan,
	PayloadPlanner,
} from '../../models/payload-plan'
import { Target, TargetDirection } from '../../models/targets'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'
import { ServerTarget } from '../../models/targets/server-target'

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
	server: ServerTarget
	available: number
}

interface NeedsBatches {
	target: ServerTarget
	batch: BatchPlans
	start: Date
	satisifiesCount: boolean
}

function getBatchDeployments(
	apps: BatchAppSelector,
	target: ServerTarget,
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
		private logger: NsLogger,
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

	*plan(rooted: Iterable<ServerTarget>): Iterable<PayloadPlan> {
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
		const serversToDeploy: ServerTarget[] = []

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
		const attackedTargets = new Set<string>()
		const satisfied = new Set<string>()

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
						this.logger,
						player,
						server
					).plan(server.moneyAvailable, server.hackDifficulty),
					start: nextBatchTick,
					satisifiesCount: false,
				})
				this.logger.trace`${
					target.name
				}\t❌ ${0}/${TotalBatchesPerTargetToPlan}`
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
							this.logger,
							player,
							target.getServer(),
							processes
						)
					})
				)

				let safeBatchCount = 0
				let lastBatchEnd = 0
				let lastBatch: Batch<BatchType> | null = null
				for (const batch of batches) {
					if (!batch.isSafe()) {
						this.logger.warn`desync ${target.name} ${batch.type}`
						for (const { server, process } of batch.getProcesses()!) {
							const killlist = killProcesses.get(server.name) ?? []
							killlist.push(process)
							killProcesses.set(server.name, killlist)
						}
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
					attackedTargets.add(target.name)
				}

				if (
					safeBatchCount >= TotalBatchesPerTargetToPlan ||
					lastBatchEnd >= now + TotalTimeWindowToPlan
				) {
					this.logger.trace`${
						target.name
					}\t✔ ${safeBatchCount}/${TotalBatchesPerTargetToPlan}; ${new Date(
						lastBatchEnd
					).toLocaleTimeString()}`
					satisfied.add(target.name)
				} else {
					this.logger.trace`${
						target.name
					}\t❌ ${safeBatchCount}/${TotalBatchesPerTargetToPlan}; ${new Date(
						lastBatchEnd
					).toLocaleTimeString()}`
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
							this.logger,
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
							satisifiesCount: safeBatchCount === 9,
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
								this.logger,
								player,
								server
							).plan(
								server.moneyAvailable * expectedGrowth,
								server.minDifficulty
							),
							start,
							satisifiesCount: safeBatchCount === 9,
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
		let curfreelist = [...from(freelist)]
		for (const { target, batch, start, satisifiesCount } of needsBatches) {
			const batchDeployments = getBatchDeployments(
				this.appSelector,
				target,
				batch,
				start
			)
			const totalFree = reduce(
				curfreelist,
				(acc, cur) => acc + cur.available,
				0
			)
			if (batchDeployments.totalRam > totalFree) {
				this.logger
					.debug`${target.name}\t❌ not enough RAM available for ${batch.type}`
				continue
			}

			let lastfreelist = [...curfreelist]

			const deployServers: Array<{ server: Target; deploy: DeployPlan }>[] = []
			for (const deploy of batchDeployments.deploys) {
				const nextfreelist: FreeRam[] = []
				let threadsNeeded = deploy.threads
				const curDeployServers: Array<{ server: Target; deploy: DeployPlan }> =
					[]
				for (const { server, available } of curfreelist) {
					if (threadsNeeded <= 0) {
						nextfreelist.push({ server, available })
						continue
					}
					if (available < deploy.app.ramCost) {
						nextfreelist.push({ server, available })
						continue
					}
					const threads = Math.floor(available / deploy.app.ramCost)
					curDeployServers.push({ server, deploy: { ...deploy, threads } })
					threadsNeeded -= threads
					const remainingAvailable = available - threads * deploy.app.ramCost
					if (remainingAvailable > 0) {
						nextfreelist.push({
							server,
							available: remainingAvailable,
						})
					}
				}
				if (threadsNeeded > 0) {
					// not enough contiguous RAM even spread across all available free room
					break
				}
				this.logger
					.debug`${target.name}\t⚒ batching ${batch.type} from ${batch.start} to ${batch.end}`
				deployServers.push(curDeployServers)
				curfreelist = [
					...from(nextfreelist).pipe(orderByDescending((f) => f.available)),
				]
				lastfreelist = [...curfreelist]
			}
			if (deployServers.length === batchDeployments.deploys.length) {
				attackedTargets.add(target.name)
				if (
					satisifiesCount ||
					start.getTime() + batch.end >= now + TotalTimeWindowToPlan
				) {
					satisfied.add(target.name)
				}
				for (const deployServer of deployServers.flat()) {
					const deploylist = deployments.get(deployServer.server.name) ?? []
					deploylist.push(deployServer.deploy)
					deployments.set(deployServer.server.name, deploylist)
				}
			} else {
				curfreelist = lastfreelist
				this.logger
					.debug`${target.name}\t❌ not enough contiguous RAM available for ${batch.type}`
			}
		}

		this.freeRam += reduce(curfreelist, (acc, cur) => acc + cur.available, 0)
		this.satisfiedTargets = satisfied.size
		this.attackedTargets = attackedTargets.size

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
