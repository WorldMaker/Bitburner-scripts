import { ulid } from 'ulid'
import { Batch, BatchPlans } from '../batch'
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
	): BatchPlans {
		const desiredWeaken = expectedSecurityLevel - this.server.minDifficulty
		const threads = Math.max(
			1,
			Math.ceil(desiredWeaken / WeakenSecurityLowerPerThread)
		)
		const weakenTime = this.ns.formulas.hacking.weakenTime(
			{
				...this.server,
				moneyAvailable: expectedMoneyAvailable,
				hackDifficulty: expectedSecurityLevel,
			},
			this.player
		)
		return {
			type: this.type,
			id: ulid(),
			start: 0,
			end: weakenTime,
			plans: [
				{
					direction: 'weaken',
					start: 0,
					end: weakenTime,
					threads,
				},
			],
		}
	}
}
