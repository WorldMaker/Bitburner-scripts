import {
	groupBy,
	GroupedIterable,
} from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import { orderBy } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { NsLogger } from '../logging/logger'
import { BadBatch } from './batches/bad'
import { DirBatch } from './batches/dir'
import { GwBatch } from './batches/gw'
import { HwgwBatch } from './batches/hwgw'
import { WBatch } from './batches/w'
import { WgwBatch } from './batches/wgw'
import { RunningProcess } from './memory'
import { Target, TargetDirection } from './targets'

export const StartDelay = 200 /* ms */
export const BatchTick = 1 /* s */ * 1000 /* ms */

export type BatchType = 'w' | 'gw' | 'wgw' | 'hwgw' | 'bad' | 'dir'

export function getBatchTypeEmoji(type: BatchType): string {
	switch (type) {
		case 'dir':
			return '🏹'
		case 'hwgw':
			return '🐱‍💻'
		case 'gw':
			return '📈'
		case 'wgw':
			return '💗'
		case 'w':
			return '🧓'
		case 'bad':
		default:
			return '❌'
	}
}

export interface BatchPlan {
	direction: TargetDirection
	threads: number
	start: number
	end: number
}

export function batchPlanReducer(acc: BatchPlan, cur: RunningProcess) {
	return {
		direction: acc.direction,
		start: Math.min(acc.start, cur.process.args[2] as number),
		end: Math.max(acc.end, cur.process.args[3] as number),
		threads: acc.threads + cur.process.threads,
	}
}

export function batchPlanSeed(direction: TargetDirection) {
	return {
		direction,
		start: Infinity,
		end: -Infinity,
		threads: 0,
	}
}

export function reduceBatchPlan(
	group: GroupedIterable<TargetDirection | undefined, RunningProcess>
) {
	if (!group.key) {
		return undefined
	}
	return reduce(group, batchPlanReducer, batchPlanSeed(group.key))
}

export function reduceDoubleWeakens(
	group: GroupedIterable<TargetDirection | undefined, RunningProcess>
) {
	if (group.key !== 'weaken') {
		return undefined
	}
	const processesByStart = [
		...group.pipe(
			groupBy((process) => process.process.args[2] as number),
			orderBy((g) => g.key)
		),
	]
	if (processesByStart.length > 2 || processesByStart.length === 0) {
		return false
	}
	if (processesByStart.length === 1) {
		// assume w1process completed
		const w2process = reduce(
			processesByStart[0],
			batchPlanReducer,
			batchPlanSeed('weaken')
		)
		return {
			w1Process: undefined,
			w2process,
		}
	}
	const w1Process = reduce(
		processesByStart[0],
		batchPlanReducer,
		batchPlanSeed('weaken')
	)
	const w2Process = reduce(
		processesByStart[1],
		batchPlanReducer,
		batchPlanSeed('weaken')
	)
	return {
		w1Process,
		w2Process,
	}
}

export interface BatchPlans {
	type: BatchType
	id: string
	plans: BatchPlan[]
	start: number
	end: number
	endTicks: number
}

export interface Batch<T extends BatchType> {
	type: T
	server: Server
	getProcesses(): RunningProcess[] | undefined
	applyProcesses(processes: RunningProcess[]): boolean
	expectedGrowth(): number | undefined
	getEndTime(): number | undefined
	getStartTime(): number | undefined
	isSafe(): boolean
	isStableHack(): boolean
	plan(
		expectedMoneyAvailable: number,
		expectedSecurityLevel: number
	): BatchPlans
}

export function getNextBatchType<T extends BatchType>(
	target: Target,
	expectedMoneyAvailable: number,
	expectedSecurityLevel: number,
	batch?: Batch<T>
) {
	if (batch?.isStableHack()) {
		return batch.type
	}
	switch (batch?.type) {
		case 'w':
			// if the server previously only needed weakening, we can start hacking
			return 'hwgw'
		case 'gw':
		case 'wgw':
			const expectedGrowth = batch?.expectedGrowth()
			if (
				expectedGrowth &&
				expectedGrowth * expectedMoneyAvailable >= target.getWorth()
			) {
				// grown enough, time to hack
				return 'hwgw'
			} else {
				// the server should not need preweakening on subsequent batches
				return 'gw'
			}
			break
	}
	if (expectedMoneyAvailable < target.getWorth()) {
		if (expectedSecurityLevel > target.getMinSecurityLevel()) {
			return 'w' // 'wgw' may be too hard to prove stable
		} else {
			return 'gw'
		}
	} else if (expectedSecurityLevel > target.getMinSecurityLevel()) {
		return 'w'
	} else {
		return 'hwgw'
	}
}

export function createBatch(
	ns: NS,
	type: BatchType,
	logger: NsLogger,
	player: Player,
	server: Server,
	processes?: RunningProcess[]
) {
	switch (type) {
		case 'w':
			return new WBatch(ns, player, server, processes)
		case 'gw':
			return new GwBatch(ns, logger, player, server, processes)
		case 'wgw':
			return new WgwBatch(ns, player, server, processes)
		case 'hwgw':
			return new HwgwBatch(ns, player, server, processes)
		case 'dir':
			return new DirBatch(
				ns,
				undefined,
				undefined,
				undefined,
				server,
				processes
			)
		case 'bad':
		default:
			ns.print(
				`WARN bad batch discovered with ${type} and ${processes?.length} processes`
			)
			return new BadBatch(server, processes)
	}
}

export function getBatchArgs(plans: BatchPlans, start: Date) {
	const startTime = start.getTime()
	return [startTime + plans.start, startTime + plans.end, plans.type, plans.id]
}
