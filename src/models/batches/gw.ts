import { ulid } from 'ulid'
import { BatchPayloadG, BatchPayloadW } from '../../services/app-cache'
import { Batch, BatchPlans, BatchTick } from '../batch'
import {
	WeakenSecurityLowerPerThread,
	GrowthSecurityRaisePerThread,
	calculateGrowThreads,
} from '../hackmath'
import { RunningProcess } from '../memory'

export class GwBatch implements Batch<'gw'> {
	public readonly type = 'gw'
	private growProcess?: RunningProcess
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

	getProcesses() {
		return this.processes
	}

	applyProcesses(processes: RunningProcess[]) {
		this.processes = processes
		if (processes.length !== 2) {
			return false
		}
		this.growProcess = processes.find(
			({ process }) => process.filename === BatchPayloadG
		)
		this.wProcess = processes.find(
			({ process }) => process.filename === BatchPayloadW
		)
		return Boolean(this.growProcess && this.wProcess)
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

	getGrowStart() {
		if (!this.growProcess) {
			return undefined
		}
		const [, , start] = this.growProcess.process.args
		return Number(start)
	}

	getWStart() {
		if (!this.wProcess) {
			return undefined
		}
		const [, , start] = this.wProcess.process.args
		return Number(start)
	}

	getStartTime(): number | undefined {
		const growStart = this.getGrowStart()
		const wStart = this.getWStart()
		if (!growStart || !wStart) {
			return undefined
		}
		return Math.min(growStart, wStart)
	}

	getWFinish() {
		if (!this.wProcess) {
			return undefined
		}
		const [, , wStart] = this.wProcess.process.args
		return (
			Number(wStart) +
			this.ns.formulas.hacking.weakenTime(this.server, this.player)
		)
	}

	getEndTime(): number | undefined {
		return this.getWFinish()
	}

	isSafe() {
		if (!this.growProcess || !this.wProcess) {
			return false
		}
		const growStart = this.getGrowStart()!
		const growFinish =
			growStart + this.ns.formulas.hacking.growTime(this.server, this.player)
		// TODO: check grow should be big enough?
		const wFinish = this.getWFinish()!
		// grow should finish before w2 start
		if (growFinish > wFinish) {
			return false
		}
		const growSecurityGrowth =
			this.growProcess.process.threads * GrowthSecurityRaisePerThread
		const wThreadsNeeded = growSecurityGrowth / WeakenSecurityLowerPerThread
		// weaken should be enough to recoup grow security raise
		if (wThreadsNeeded < this.wProcess.process.threads) {
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
		const expectedServer: Server = {
			...this.server,
			moneyAvailable: expectedMoneyAvailable,
			hackDifficulty: expectedSecurityLevel,
		}
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
		const weakenTime = this.ns.formulas.hacking.weakenTime(
			expectedServer,
			this.player
		)
		const weakenThreads = Math.max(
			1,
			Math.ceil(growSecurity / WeakenSecurityLowerPerThread)
		)

		// timing with t=0 at end point
		const growStart = -1 * BatchTick - growTime
		const weakenStart = 0 * BatchTick - weakenTime
		// offset for t=0 at batch start
		const startOffset = -Math.min(growStart, weakenStart)

		return {
			type: this.type,
			id: ulid(),
			start: 0,
			end: startOffset + weakenStart + weakenTime,
			endTicks: 2,
			plans: [
				{
					direction: 'grow',
					start: startOffset + growStart,
					end: startOffset + growStart + growTime,
					threads: growThreads,
				},
				{
					direction: 'weaken',
					start: startOffset + weakenStart,
					end: startOffset + weakenStart + weakenTime,
					threads: weakenThreads,
				},
			],
		}
	}
}
