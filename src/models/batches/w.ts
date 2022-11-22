import { Batch, BatchPlan, StartDelay } from '../batch'
import { WeakenSecurityLowerPerThread } from '../hackmath'

export class WBatch implements Batch<'w'> {
	public readonly type = 'w'

	constructor(
		private readonly ns: NS,
		private player: Player,
		private readonly server: Server,
		private wProcess?: ProcessInfo
	) {}

	getEndTime(): number | undefined {
		if (!this.wProcess) {
			return undefined
		}
		const [, , start] = this.wProcess.args
		return (
			Number(start) +
			this.ns.formulas.hacking.weakenTime(this.server, this.player)
		)
	}

	isStableHack(): boolean {
		return false
	}

	isSafe(): boolean {
		return Boolean(this.wProcess)
	}

	plan(): Iterable<BatchPlan> {
		const desiredWeaken = this.server.hackDifficulty - this.server.minDifficulty
		const threads = desiredWeaken / WeakenSecurityLowerPerThread
		return [
			{
				direction: 'weaken',
				start: new Date().getTime() + StartDelay,
				threads,
			},
		]
	}
}
