import { Batch, BatchPlan } from '../batch'
import {
	DesiredHackingSkim,
	HackSecurityRaisePerThread,
	WeakenSecurityLowerPerThread,
	GrowthSecurityRaisePerThread,
} from '../hackmath'

export class HwgwBatch implements Batch<'hwgw'> {
	public readonly type = 'hwgw'

	constructor(
		private readonly ns: NS,
		public readonly player: Player,
		public readonly server: Server,
		private hackProcess?: ProcessInfo,
		private w1Process?: ProcessInfo,
		private growProcess?: ProcessInfo,
		private w2Process?: ProcessInfo
	) {}

	getHackStart() {
		if (!this.hackProcess) {
			return undefined
		}
		// batch args: [cmd, target, startTime, batchId?]
		const [, , start] = this.hackProcess.args
		return Number(start)
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
		const hackStart = this.getHackStart()
		const w1Start = this.getW1Start()
		const growStart = this.getGrowStart()
		const w2Start = this.getW2Start()
		if (!hackStart || !w1Start || !growStart || !w2Start) {
			return undefined
		}
		return Math.min(hackStart, w1Start, growStart, w2Start)
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
		if (
			!this.hackProcess ||
			!this.w1Process ||
			!this.growProcess ||
			!this.w2Process
		) {
			return false
		}
		const hackStart = this.getHackStart()!
		const hackFinish =
			hackStart + this.ns.formulas.hacking.hackTime(this.server, this.player)
		const w1Start = this.getW1Start()!
		const w1Finish =
			w1Start + this.ns.formulas.hacking.weakenTime(this.server, this.player)
		// hack should finish before w1
		if (hackFinish > w1Finish) {
			return false
		}
		const hackSkim =
			this.ns.formulas.hacking.hackPercent(this.server, this.player) *
			this.hackProcess.threads
		// hack shouldn't skim too much
		if (hackSkim > DesiredHackingSkim) {
			return false
		}
		const hackSecurityGrowth =
			this.hackProcess.threads * HackSecurityRaisePerThread
		const w1ThreadsNeeded = hackSecurityGrowth / WeakenSecurityLowerPerThread
		// w1 should be enough to recoup hack security raise
		if (w1ThreadsNeeded < this.w1Process.threads) {
			return false
		}
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
		return this.isSafe()
	}

	plan(): Iterable<BatchPlan> {
		throw new Error('TODO')
	}
}
