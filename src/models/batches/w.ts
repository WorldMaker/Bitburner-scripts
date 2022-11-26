import { ulid } from 'ulid'
import { Batch, BatchPlans } from '../batch'
import { WeakenSecurityLowerPerThread } from '../hackmath'
import { RunningProcess } from '../memory'

export class WBatch implements Batch<'w'> {
	public readonly type = 'w'
	private wProcess?: RunningProcess

	constructor(
		private readonly ns: NS,
		public readonly player: Player,
		public readonly server: Server,
		private processes?: RunningProcess[]
	) {
		if (processes) {
			this.applyProcesses(processes)
		}
	}

	getProcesses(): RunningProcess[] | undefined {
		return this.processes
	}

	applyProcesses(processes: RunningProcess[]) {
		this.processes = processes
		if (processes.length !== 1) {
			return false
		}
		this.wProcess = processes[0]
		return true
	}

	expectedGrowth(): number | undefined {
		return undefined
	}

	getStartTime(): number | undefined {
		if (!this.wProcess) {
			return undefined
		}
		const [, , start] = this.wProcess.process.args
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
			endTicks: 1,
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
