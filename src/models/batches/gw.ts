import { Batch, BatchPlan, BatchTick } from '../batch'
import {
	WeakenSecurityLowerPerThread,
	GrowthSecurityRaisePerThread,
} from '../hackmath'

export class GwBatch implements Batch<'gw'> {
	public readonly type = 'gw'

	constructor(
		private readonly ns: NS,
		public readonly player: Player,
		public readonly server: Server,
		private growProcess?: ProcessInfo,
		private wProcess?: ProcessInfo
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

	getGrowStart() {
		if (!this.growProcess) {
			return undefined
		}
		const [, , start] = this.growProcess.args
		return Number(start)
	}

	getWStart() {
		if (!this.wProcess) {
			return undefined
		}
		const [, , start] = this.wProcess.args
		return Number(start)
	}

	getStartTime(): number | undefined {
		const growStart = this.getGrowStart()
		const wStart = this.getWStart()
		if (!growStart || !wStart) {
			return undefined
		}
		return Math.min(growStart, wStart)
	}

	getWFinish() {
		if (!this.wProcess) {
			return undefined
		}
		const [, , wStart] = this.wProcess.args
		return (
			Number(wStart) +
			this.ns.formulas.hacking.weakenTime(this.server, this.player)
		)
	}

	getEndTime(): number | undefined {
		return this.getWFinish()
	}

	isSafe() {
		if (!this.growProcess || !this.wProcess) {
			return false
		}
		const growStart = this.getGrowStart()!
		const growFinish =
			growStart + this.ns.formulas.hacking.growTime(this.server, this.player)
		// TODO: check grow should be big enough?
		const wFinish = this.getWFinish()!
		// grow should finish before w2 start
		if (growFinish > wFinish) {
			return false
		}
		const growSecurityGrowth =
			this.growProcess.threads * GrowthSecurityRaisePerThread
		const wThreadsNeeded = growSecurityGrowth / WeakenSecurityLowerPerThread
		// weaken should be enough to recoup grow security raise
		if (wThreadsNeeded < this.wProcess.threads) {
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
		const growTime = this.ns.formulas.hacking.growTime(this.server, this.player)
		const growAmount =
			expectedMoneyAvailable / (this.server.moneyMax - expectedMoneyAvailable)
		const growThreads = Math.max(
			1,
			Math.ceil(this.ns.growthAnalyze(this.server.hostname, growAmount))
		)
		const weakenTime = this.ns.formulas.hacking.weakenTime(
			this.server,
			this.player
		)
		const weakenThreads = Math.max(
			1,
			Math.ceil(
				(growThreads * GrowthSecurityRaisePerThread) /
					WeakenSecurityLowerPerThread
			)
		)

		// timing with t=0 at end point
		const growStart = -1 * BatchTick - growTime
		const weakenStart = 0 * BatchTick - weakenTime
		// offset for t=0 at batch start
		const startOffset = -Math.min(growStart, weakenStart)

		return [
			{
				direction: 'grow',
				start: startOffset + growStart,
				end: startOffset + growStart + growTime,
				threads: growThreads,
			},
			{
				direction: 'weaken',
				start: startOffset + weakenStart,
				end: startOffset + weakenStart + weakenTime,
				threads: weakenThreads,
			},
		]
	}
}
