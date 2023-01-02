import { Batch, BatchPlans } from '../batch'
import { RunningProcess } from '../memory'

export class BadBatch implements Batch<'bad'> {
	public readonly type = 'bad'

	constructor(public server: Server, private processes?: RunningProcess[]) {}

	getProcesses(): RunningProcess[] | undefined {
		return this.processes
	}

	applyProcesses(processes: RunningProcess[]): boolean {
		this.processes = processes
		return false
	}

	expectedGrowth(): number | undefined {
		return undefined
	}

	getEndTime(): number | undefined {
		return undefined
	}

	getStartTime(): number | undefined {
		return undefined
	}

	isSafe(): boolean {
		return false
	}

	isStableHack(): boolean {
		return false
	}

	plan(
		_expectedMoneyAvailable: number,
		_expectedSecurityLevel: number
	): BatchPlans {
		throw new Error('Attempted to plan a Bad Batch')
	}
}
