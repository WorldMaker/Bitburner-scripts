import { Batch, BatchPlans } from '../batch'

export class BadBatch implements Batch<'bad'> {
	public readonly type = 'bad'

	constructor(public server: Server, private processes?: ProcessInfo[]) {}

	getProcesses(): ProcessInfo[] | undefined {
		return this.processes
	}

	applyProcesses(processes: ProcessInfo[]): boolean {
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
		expectedMoneyAvailable: number,
		expectedSecurityLevel: number
	): BatchPlans {
		throw new Error('Attempted to plan a Bad Batch')
	}
}
