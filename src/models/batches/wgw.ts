import { ulid } from 'ulid'
import { BatchPayloadG, BatchPayloadW } from '../../services/app-cache'
import { Batch, BatchPlans, BatchTick } from '../batch'
import {
	WeakenSecurityLowerPerThread,
	GrowthSecurityRaisePerThread,
	calculateGrowThreads,
} from '../hackmath'
import { RunningProcess } from '../memory'

export class WgwBatch implements Batch<'wgw'> {
	public readonly type = 'wgw'
	private w1Process?: RunningProcess
	private growProcess?: RunningProcess
	private w2Process?: RunningProcess

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
		if (processes.length !== 3) {
			return false
		}
		this.growProcess = processes.find(
			({ process }) => process.filename === BatchPayloadG
		)
		const weakenProcesses = processes
			.filter(({ process }) => process.filename === BatchPayloadW)
			// ['batch', target, start, ...]
			.sort(
				({ process: aProcess }, { process: bProcess }) =>
					Number(aProcess.args[2]) - Number(bProcess.args[2])
			)
		if (weakenProcesses.length != 2) {
			return false
		}
		this.w1Process = weakenProcesses[0]
		this.w2Process = weakenProcesses[1]
		return Boolean(this.growProcess && this.w1Process && this.w2Process)
	}

	expectedGrowth(): number | undefined {
		if (!this.growProcess) {
			return undefined
		}
		return this.ns.formulas.hacking.growPercent(
			this.server,
			this.growProcess.process.threads,
			this.player
		)
	}

	getW1Start() {
		if (!this.w1Process) {
			return undefined
		}
		const [, , start] = this.w1Process.process.args
		return Number(start)
	}

	getGrowStart() {
		if (!this.growProcess) {
			return undefined
		}
		const [, , start] = this.growProcess.process.args
		return Number(start)
	}

	getW2Start() {
		if (!this.w2Process) {
			return undefined
		}
		const [, , start] = this.w2Process.process.args
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
		const [, , w2Start] = this.w2Process.process.args
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
			this.growProcess.process.threads * GrowthSecurityRaisePerThread
		const w2ThreadsNeeded = growSecurityGrowth / WeakenSecurityLowerPerThread
		// w2 should be enough to recoup grow security raise
		if (w2ThreadsNeeded < this.w2Process.process.threads) {
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
	): BatchPlans {
		const desiredWeaken = expectedSecurityLevel - this.server.minDifficulty
		const w1Threads = Math.max(
			1,
			Math.ceil(desiredWeaken / WeakenSecurityLowerPerThread)
		)
		const expectedServer: Server = {
			...this.server,
			moneyAvailable: expectedMoneyAvailable,
			hackDifficulty: expectedSecurityLevel,
		}
		const weakenTime = this.ns.formulas.hacking.weakenTime(
			expectedServer,
			this.player
		)
		const growTime = this.ns.formulas.hacking.growTime(
			expectedServer,
			this.player
		)
		const growThreads = Math.max(
			1,
			calculateGrowThreads(
				this.ns.formulas.hacking,
				expectedServer,
				this.player
			)
		)
		const growSecurity = growThreads * GrowthSecurityRaisePerThread
		const w2Threads = Math.max(
			1,
			Math.ceil(growSecurity / WeakenSecurityLowerPerThread)
		)

		// timing with t=0 at end point
		const w1Start = -2 * BatchTick - weakenTime
		const growStart = -1 * BatchTick - growTime
		const w2Start = 0 * BatchTick - weakenTime
		// offset for t=0 at batch start
		const startOffset = -Math.min(w1Start, growStart, w2Start)

		return {
			type: this.type,
			id: ulid(),
			start: 0,
			end: startOffset + w2Start + weakenTime,
			endTicks: 3,
			plans: [
				{
					direction: 'weaken',
					start: startOffset + w1Start,
					end: startOffset + w1Start + weakenTime,
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
					end: startOffset + w2Start + weakenTime,
					threads: w2Threads,
				},
			],
		}
	}
}
