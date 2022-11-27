import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { groupBy } from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import { ulid } from 'ulid'
import { getBatchPayloadDirection } from '../app'
import { Batch, BatchPlan, BatchPlans, reduceBatchPlan } from '../batch'
import { WeakenSecurityLowerPerThread } from '../hackmath'
import { RunningProcess } from '../memory'

const { from } = IterableX

export class WBatch implements Batch<'w'> {
	public readonly type = 'w'
	private wProcess?: BatchPlan

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
		const processesByDirection = from(processes).pipe(
			groupBy((process) => getBatchPayloadDirection(process.process.filename))
		)
		for (const group of processesByDirection) {
			switch (group.key) {
				case 'grow':
					return false
				case 'hack':
					return false
				case 'weaken':
					this.wProcess = reduceBatchPlan(group)
					break
				default:
					return false
			}
		}
		return true
	}

	expectedGrowth(): number | undefined {
		return undefined
	}

	getStartTime(): number | undefined {
		if (!this.wProcess) {
			return undefined
		}
		return this.wProcess.start
	}

	getEndTime(): number | undefined {
		if (!this.wProcess) {
			return undefined
		}
		return this.wProcess.end
	}

	isStableHack(): boolean {
		return false
	}

	isSafe(): boolean {
		// weakens are always safe
		return true
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
