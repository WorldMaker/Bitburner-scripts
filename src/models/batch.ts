import {
	DesiredHackingSkim,
	GrowthSecurityRaisePerThread,
	HackSecurityRaisePerThread,
	WeakenSecurityLowerPerThread,
} from './hackmath'

export class Batch {
	constructor(
		private readonly ns: NS,
		public readonly player: Player,
		public readonly server: Server,
		private hackProcess?: ProcessInfo,
		private w1Process?: ProcessInfo,
		private growProcess?: ProcessInfo,
		private w2Process?: ProcessInfo
	) {}

	isSafe() {
		if (
			!this.hackProcess ||
			!this.w1Process ||
			!this.growProcess ||
			!this.w2Process
		) {
			return false
		}
		// batch args: [cmd, target, startTime, batchId?]
		const [, , hackStart] = this.hackProcess.args
		const hackFinish =
			Number(hackStart) +
			this.ns.formulas.hacking.hackTime(this.server, this.player)
		const [, , w1Start] = this.w1Process.args
		const w1Finish =
			Number(w1Start) +
			this.ns.formulas.hacking.weakenTime(this.server, this.player)
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
		const [, , growStart] = this.growProcess.args
		const growFinish =
			Number(growStart) +
			this.ns.formulas.hacking.growTime(this.server, this.player)
		// w1 should finish before grow start
		if (w1Finish > growFinish) {
			return false
		}
		// TODO: check grow should be big enough?
		const [, , w2Start] = this.w2Process.args
		const w2Finish =
			Number(w2Start) +
			this.ns.formulas.hacking.weakenTime(this.server, this.player)
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
}
