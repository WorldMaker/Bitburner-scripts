import { Batch, BatchPlan, BatchTick } from '../batch'
import {
	WeakenSecurityLowerPerThread,
	GrowthSecurityRaisePerThread,
} from '../hackmath'

export class WgwBatch implements Batch<'wgw'> {
	public readonly type = 'wgw'

	constructor(
		private readonly ns: NS,
		public readonly player: Player,
		public readonly server: Server,
		private w1Process?: ProcessInfo,
		private growProcess?: ProcessInfo,
		private w2Process?: ProcessInfo
	) {}

	expectedGrowth(): number | undefined {
		if (!this.growProcess) {
			return undefined
		}
		return this.ns.formulas.hacking.growPercent(
			this.server,
			this.growProcess.threads,
			this.player
		)
	}

	getW1Start() {
		if (!this.w1Process) {
			return undefined
		}
		const [, , start] = this.w1Process.args
		return Number(start)
	}

	getGrowStart() {
		if (!this.growProcess) {
			return undefined
		}
		const [, , start] = this.growProcess.args
		return Number(start)
	}

	getW2Start() {
		if (!this.w2Process) {
			return undefined
		}
		const [, , start] = this.w2Process.args
		return Number(start)
	}

	getStartTime(): number | undefined {
		const w1Start = this.getW1Start()
		const growStart = this.getGrowStart()
		const w2Start = this.getW2Start()
		if (!w1Start || !growStart || !w2Start) {
			return undefined
		}
		return Math.min(w1Start, growStart, w2Start)
	}

	getW2Finish() {
		if (!this.w2Process) {
			return undefined
		}
		const [, , w2Start] = this.w2Process.args
		return (
			Number(w2Start) +
			this.ns.formulas.hacking.weakenTime(this.server, this.player)
		)
	}

	getEndTime(): number | undefined {
		return this.getW2Finish()
	}

	isSafe() {
		if (!this.w1Process || !this.growProcess || !this.w2Process) {
			return false
		}
		const w1Start = this.getW1Start()!
		const w1Finish =
			w1Start + this.ns.formulas.hacking.weakenTime(this.server, this.player)
		// TODO: check weaken is enough to minimize security?
		const growStart = this.getGrowStart()!
		const growFinish =
			growStart + this.ns.formulas.hacking.growTime(this.server, this.player)
		// w1 should finish before grow start
		if (w1Finish > growFinish) {
			return false
		}
		// TODO: check grow should be big enough?
		const w2Finish = this.getW2Finish()!
		// grow should finish before w2 start
		if (growFinish > w2Finish) {
			return false
		}
		const growSecurityGrowth =
			this.growProcess.threads * GrowthSecurityRaisePerThread
		const w2ThreadsNeeded = growSecurityGrowth / WeakenSecurityLowerPerThread
		// w2 should be enough to recoup grow security raise
		if (w2ThreadsNeeded < this.w2Process.threads) {
			return false
		}
		return true
	}

	isStableHack(): boolean {
		return false
	}

	plan(
		expectedMoneyAvailable: number,
		expectedSecurityLevel: number
	): Iterable<BatchPlan> {
		const desiredWeaken = expectedSecurityLevel - this.server.minDifficulty
		const w1Threads = desiredWeaken / WeakenSecurityLowerPerThread
		const growTime = this.ns.formulas.hacking.growTime(this.server, this.player)
		const growAmount =
			expectedMoneyAvailable / (this.server.moneyMax - expectedMoneyAvailable)
		const growThreads = this.ns.growthAnalyze(this.server.hostname, growAmount)
		const weakenTime = this.ns.formulas.hacking.weakenTime(
			this.server,
			this.player
		)
		const w2Threads =
			(growThreads * GrowthSecurityRaisePerThread) /
			WeakenSecurityLowerPerThread

		// timing with t=0 at end point
		const w1Start = -2 * BatchTick - weakenTime
		const growStart = -1 * BatchTick - growTime
		const w2Start = 0 * BatchTick - weakenTime
		// offset for t=0 at batch start
		const startOffset = -Math.min(w1Start, growStart, w2Start)

		return [
			{
				direction: 'weaken',
				start: startOffset + w1Start,
				threads: w1Threads,
			},
			{
				direction: 'grow',
				start: startOffset + growStart,
				threads: growThreads,
			},
			{
				direction: 'weaken',
				start: startOffset + w2Start,
				threads: w2Threads,
			},
		]
	}
}
