import { HwgwBatch } from './batches/hwgw'
import { WBatch } from './batches/w'
import { SimpleTarget, TargetDirection } from './target'

export const StartDelay = 200 /* ms */

export type BatchType = 'w' | 'gw' | 'wgw' | 'hwgw'

export interface BatchPlan {
	direction: TargetDirection
	threads: number
	start: number
}

export interface Batch<T extends BatchType> {
	type: T
	getEndTime(): number | undefined
	getStartTime(): number | undefined
	isSafe(): boolean
	isStableHack(): boolean
	plan(): Iterable<BatchPlan>
}

export function getNextBatchType<T extends BatchType>(
	target: SimpleTarget,
	batch?: Batch<T>
) {
	if (batch?.isStableHack()) {
		return batch.type
	}
	if (target.checkMoneyAvailable() < target.getWorth()) {
		if (target.checkSecurityLevel() > target.getMinSecurityLevel()) {
			return 'wgw'
		} else {
			return 'gw'
		}
	} else if (target.checkSecurityLevel() > target.getMinSecurityLevel()) {
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
		case 'hwgw':
			return new HwgwBatch(ns, player, server, ...args)
	}
}
