import { Batch, BatchPlan, BatchTick } from '../batch'
import {
	WeakenSecurityLowerPerThread,
	GrowthSecurityRaisePerThread,
	calculateGrowThreads,
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
		const w1Threads = Math.max(
			1,
			Math.ceil(desiredWeaken / WeakenSecurityLowerPerThread)
		)
		const w1Server: Server = {
			...this.server,
			moneyAvailable: expectedMoneyAvailable,
			hackDifficulty: expectedSecurityLevel,
		}
		const w1Time = this.ns.formulas.hacking.weakenTime(w1Server, this.player)
		const growServer: Server = {
			...this.server,
			moneyAvailable: expectedMoneyAvailable,
			hackDifficulty: this.server.minDifficulty,
		}
		const growTime = this.ns.formulas.hacking.growTime(growServer, this.player)
		const growThreads = Math.max(
			1,
			calculateGrowThreads(this.ns.formulas.hacking, growServer, this.player)
		)
		const growSecurity = growThreads * GrowthSecurityRaisePerThread
		const w2Server: Server = {
			...this.server,
			moneyAvailable: this.server.moneyMax,
			hackDifficulty: this.server.minDifficulty + growSecurity,
		}
		const w2Time = this.ns.formulas.hacking.weakenTime(w2Server, this.player)
		const w2Threads = Math.max(
			1,
			Math.ceil(
				(w2Server.hackDifficulty - w2Server.minDifficulty) /
					WeakenSecurityLowerPerThread
			)
		)

		// timing with t=0 at end point
		const w1Start = -2 * BatchTick - w1Time
		const growStart = -1 * BatchTick - growTime
		const w2Start = 0 * BatchTick - w2Time
		// offset for t=0 at batch start
		const startOffset = -Math.min(w1Start, growStart, w2Start)

		return [
			{
				direction: 'weaken',
				start: startOffset + w1Start,
				end: startOffset + w1Start + w1Time,
				threads: w1Threads,
			},
			{
				direction: 'grow',
				start: startOffset + growStart,
				end: startOffset + growStart + growTime,
				threads: growThreads,
			},
			{
				direction: 'weaken',
				start: startOffset + w2Start,
				end: startOffset + w2Start + w2Time,
				threads: w2Threads,
			},
		]
	}
}
