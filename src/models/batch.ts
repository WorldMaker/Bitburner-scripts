import { BadBatch } from './batches/bad'
import { GwBatch } from './batches/gw'
import { HwgwBatch } from './batches/hwgw'
import { WBatch } from './batches/w'
import { WgwBatch } from './batches/wgw'
import { SimpleTarget, TargetDirection } from './target'

export const StartDelay = 200 /* ms */
export const BatchTick = 1 /* s */ * 1000 /* ms */

export type BatchType = 'w' | 'gw' | 'wgw' | 'hwgw' | 'bad'

export interface BatchPlan {
	direction: TargetDirection
	threads: number
	start: number
	end: number
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
	getProcesses(): ProcessInfo[] | undefined
	applyProcesses(processes: ProcessInfo[]): boolean
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
	target: SimpleTarget,
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
			return 'wgw'
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
	player: Player,
	server: Server,
	processes?: ProcessInfo[]
) {
	switch (type) {
		case 'w':
			return new WBatch(ns, player, server, processes)
		case 'gw':
			return new GwBatch(ns, player, server, processes)
		case 'wgw':
			return new WgwBatch(ns, player, server, processes)
		case 'hwgw':
			return new HwgwBatch(ns, player, server, processes)
		case 'bad':
		default:
			return new BadBatch(server, processes)
	}
}

export function getBatchArgs(plans: BatchPlans, start: Date) {
	const startTime = start.getTime()
	return [startTime + plans.start, startTime + plans.end, plans.type, plans.id]
}
