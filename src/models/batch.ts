import { GwBatch } from './batches/gw'
import { HwgwBatch } from './batches/hwgw'
import { WBatch } from './batches/w'
import { WgwBatch } from './batches/wgw'
import { SimpleTarget, TargetDirection } from './target'

export const StartDelay = 200 /* ms */
export const BatchTick = 1 /* s */ * 1000 /* ms */

export type BatchType = 'w' | 'gw' | 'wgw' | 'hwgw'

export interface BatchPlan {
	direction: TargetDirection
	threads: number
	start: number
}

export interface Batch<T extends BatchType> {
	type: T
	server: Server
	expectedGrowth(): number | undefined
	getEndTime(): number | undefined
	getStartTime(): number | undefined
	isSafe(): boolean
	isStableHack(): boolean
	plan(
		expectedMoneyAvailable: number,
		expectedSecurityLevel: number
	): Iterable<BatchPlan>
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
	...args: any[]
) {
	switch (type) {
		case 'w':
			return new WBatch(ns, player, server, ...args)
		case 'gw':
			return new GwBatch(ns, player, server, ...args)
		case 'wgw':
			return new WgwBatch(ns, player, server, ...args)
		case 'hwgw':
			return new HwgwBatch(ns, player, server, ...args)
	}
}
