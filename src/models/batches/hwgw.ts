import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { groupBy } from '@reactivex/ix-esnext-esm/iterable/operators/groupby'
import { ulid } from 'ulid'
import { getBatchPayloadDirection } from '../app'
import {
	Batch,
	BatchPlan,
	BatchPlans,
	BatchTick,
	reduceBatchPlan,
	reduceDoubleWeakens,
} from '../batch'
import {
	calculateGrowThreads,
	GrowthSecurityRaisePerThread,
	HackSecurityRaisePerThread,
	WeakenSecurityLowerPerThread,
} from '../hackmath'
import { RunningProcess } from '../memory'

const { from } = IterableX

export const BatchDesiredHackingSkim = 0.05

export class HwgwBatch implements Batch<'hwgw'> {
	public readonly type = 'hwgw'
	private hackProcess?: BatchPlan
	private w1Process?: BatchPlan
	private growProcess?: BatchPlan
	private w2Process?: BatchPlan

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
					this.growProcess = reduceBatchPlan(group)
					break
				case 'hack':
					this.hackProcess = reduceBatchPlan(group)
					break
				case 'weaken':
					const result = reduceDoubleWeakens(group)
					if (result) {
						this.w1Process = result.w1Process
						this.w2Process = result.w2Process
					}
					break
				default:
					return false
			}
		}
		return Boolean(
			this.hackProcess && this.growProcess && this.w1Process && this.w2Process
		)
	}

	expectedGrowth(): number | undefined {
		return undefined
	}

	getHackStart() {
		if (!this.hackProcess) {
			return undefined
		}
		return this.hackProcess.start
	}

	getW1Start() {
		if (!this.w1Process) {
			return undefined
		}
		return this.w1Process.start
	}

	getGrowStart() {
		if (!this.growProcess) {
			return undefined
		}
		return this.growProcess.start
	}

	getW2Start() {
		if (!this.w2Process) {
			return undefined
		}
		return this.w2Process.start
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
		return this.w2Process.end
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
			// it may be partially complete; TODO: add "stable point" timing checks
			return true
		}
		// assuming this batch started at a stable point
		const assumedServer: Server = {
			...this.server,
			hackDifficulty: this.server.minDifficulty,
			moneyAvailable: this.server.moneyAvailable,
		}
		const hackStart = this.getHackStart()!
		const hackFinish =
			hackStart + this.ns.formulas.hacking.hackTime(assumedServer, this.player)
		const w1Start = this.getW1Start()!
		const w1Finish =
			w1Start + this.ns.formulas.hacking.weakenTime(assumedServer, this.player)
		// hack should finish before w1
		if (hackFinish > w1Finish) {
			return false
		}
		const hackSkim =
			this.ns.formulas.hacking.hackPercent(assumedServer, this.player) *
			this.hackProcess.threads
		// hack shouldn't skim too much
		if (hackSkim > BatchDesiredHackingSkim) {
			return false
		}
		const hackSecurityGrowth =
			this.hackProcess.threads * HackSecurityRaisePerThread
		const w1ThreadsNeeded = hackSecurityGrowth / WeakenSecurityLowerPerThread
		// w1 should be enough to recoup hack security raise
		if (w1ThreadsNeeded > this.w1Process.threads) {
			return false
		}
		const growStart = this.getGrowStart()!
		const growFinish =
			growStart + this.ns.formulas.hacking.growTime(assumedServer, this.player)
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
		if (w2ThreadsNeeded > this.w2Process.threads) {
			return false
		}
		return true
	}

	isStableHack(): boolean {
		return this.isSafe()
	}

	plan(
		expectedMoneyAvailable: number,
		expectedSecurityLevel: number
	): BatchPlans {
		const expectedServer: Server = {
			...this.server,
			moneyAvailable: expectedMoneyAvailable,
			hackDifficulty: expectedSecurityLevel,
		}
		const hackPercent = this.ns.formulas.hacking.hackPercent(
			expectedServer,
			this.player
		)
		const hackThreads = Math.max(
			1,
			Math.ceil(BatchDesiredHackingSkim / hackPercent)
		)
		const hackTime = this.ns.formulas.hacking.hackTime(
			expectedServer,
			this.player
		)
		const hackSecurity = hackThreads * HackSecurityRaisePerThread
		const postHackMoney =
			expectedServer.moneyAvailable! -
			expectedServer.moneyAvailable! * hackThreads * hackPercent
		const weakenTime = this.ns.formulas.hacking.weakenTime(
			expectedServer,
			this.player
		)
		const w1Threads = Math.max(
			1,
			Math.ceil(hackSecurity / WeakenSecurityLowerPerThread)
		)
		const growTime = this.ns.formulas.hacking.growTime(
			expectedServer,
			this.player
		)
		const growThreads = Math.max(
			1,
			calculateGrowThreads(
				this.ns.formulas.hacking,
				{
					...expectedServer,
					moneyAvailable: postHackMoney,
				},
				this.player
			)
		)
		const growSecurity = growThreads * GrowthSecurityRaisePerThread
		const w2Threads = Math.max(
			1,
			Math.ceil(growSecurity / WeakenSecurityLowerPerThread)
		)

		// timing with t=0 at end point
		const hackStart = -3 * BatchTick - hackTime
		const w1Start = -2 * BatchTick - weakenTime
		const growStart = -1 * BatchTick - growTime
		const w2Start = 0 * BatchTick - weakenTime
		// offset for t=0 at batch start
		const startOffset = -Math.min(hackStart, w1Start, growStart, w2Start)

		return {
			type: this.type,
			id: ulid(),
			start: 0,
			end: startOffset + w2Start + weakenTime,
			endTicks: 4,
			plans: [
				{
					direction: 'hack',
					start: startOffset + hackStart,
					end: startOffset + hackStart + hackTime,
					threads: hackThreads,
				},
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
