import { Batch, BatchPlan } from '../batch'
import { WeakenSecurityLowerPerThread } from '../hackmath'

export class WBatch implements Batch<'w'> {
	public readonly type = 'w'

	constructor(
		private readonly ns: NS,
		public readonly player: Player,
		public readonly server: Server,
		private wProcess?: ProcessInfo
	) {}

	expectedGrowth(): number | undefined {
		return undefined
	}

	getStartTime(): number | undefined {
		if (!this.wProcess) {
			return undefined
		}
		const [, , start] = this.wProcess.args
		return Number(start)
	}

	getEndTime(): number | undefined {
		const start = this.getStartTime()
		if (!start) {
			return undefined
		}
		return start + this.ns.formulas.hacking.weakenTime(this.server, this.player)
	}

	isStableHack(): boolean {
		return false
	}

	isSafe(): boolean {
		return Boolean(this.wProcess)
	}

	plan(
		expectedMoneyAvailable: number,
		expectedSecurityLevel: number
	): Iterable<BatchPlan> {
		const desiredWeaken = expectedSecurityLevel - this.server.minDifficulty
		const threads = desiredWeaken / WeakenSecurityLowerPerThread
		return [
			{
				direction: 'weaken',
				start: 0,
				end: this.ns.formulas.hacking.weakenTime(this.server, this.player),
				threads,
			},
		]
	}
}
