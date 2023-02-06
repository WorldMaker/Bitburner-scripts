import { ulid } from 'ulid'
import { App, getBatchPayloadDirection } from '../app'
import { Batch, BatchPlans } from '../batch'
import {
	calculateGrowThreads,
	DesiredHackingSkim,
	GrowthSecurityRaisePerThread,
	WeakenSecurityLowerPerThread,
} from '../hackmath'
import { RunningProcess } from '../memory'
import { ServerTarget } from '../targets/server-target'

export class DirBatch implements Batch<'dir'> {
	readonly type = 'dir'
	readonly server: Server

	constructor(
		private readonly ns: NS,
		private readonly target?: ServerTarget,
		private readonly ramBudget?: number,
		private readonly app?: App,
		server?: Server,
		private processes?: RunningProcess[]
	) {
		this.server = server ?? target!.getServer()
	}

	getProcesses(): RunningProcess[] | undefined {
		return this.processes
	}

	applyProcesses(processes: RunningProcess[]): boolean {
		this.processes = processes
		return true
	}

	expectedGrowth(): number | undefined {
		return undefined
	}

	getEndTime(): number | undefined {
		return this.processes?.reduce(
			(acc, cur) => Math.max(acc, cur.process.args[3] as number),
			0
		)
	}

	getStartTime(): number | undefined {
		return this.processes?.reduce(
			(acc, cur) => Math.min(acc, cur.process.args[2] as number),
			Infinity
		)
	}

	isSafe(): boolean {
		// a 'dir' batch should all be in the same direction is always safe in that case
		const proccessDirections = this.processes?.reduce(
			(acc, cur) =>
				acc.add(getBatchPayloadDirection(cur.process.filename) ?? 'bad'),
			new Set<string>()
		)
		return (proccessDirections?.size ?? 0) <= 1
	}

	isStableHack(): boolean {
		return false
	}

	plan(
		expectedMoneyAvailable: number,
		expectedSecurityLevel: number
	): BatchPlans {
		if (!this.target || !this.app || !this.ramBudget) {
			throw new Error('Unable to plan dir batch without budget or target info')
		}

		const formulasExist = this.ns.fileExists('Formulas.exe')
		switch (this.target.getTargetDirection()) {
			case 'grow': {
				const moneyAvailable = expectedMoneyAvailable
				const targetGrowPercent =
					moneyAvailable / (this.target.getWorth() - moneyAvailable)
				const securityAvailable =
					this.target.getSecurityThreshold() - expectedSecurityLevel
				const totalPossibleGrowThreads = Math.floor(
					Math.min(
						this.ramBudget / this.app.ramCost,
						securityAvailable / GrowthSecurityRaisePerThread
					)
				)
				if (formulasExist) {
					const player = this.ns.getPlayer()
					const server = this.ns.getServer(this.target.name)
					const growThreads = Math.max(
						1,
						Math.min(
							totalPossibleGrowThreads,
							calculateGrowThreads(this.ns.formulas.hacking, server, player)
						)
					)
					const growTime = this.ns.formulas.hacking.growTime(server, player)
					return {
						end: growTime,
						endTicks: 1,
						id: ulid(),
						plans: [
							{
								direction: 'grow',
								end: growTime,
								start: 0,
								threads: growThreads,
							},
						],
						start: 0,
						type: this.type,
					}
				}
				if (targetGrowPercent < 1) {
					const growthThreads = this.ns.growthAnalyze(
						this.target.name,
						1 + targetGrowPercent
					)
					const growThreads = Math.max(
						1,
						Math.min(totalPossibleGrowThreads, Math.ceil(growthThreads))
					)
					return {
						end: Infinity,
						endTicks: 1,
						id: ulid(),
						plans: [
							{
								direction: 'grow',
								end: Infinity,
								start: 0,
								threads: growThreads,
							},
						],
						start: 0,
						type: this.type,
					}
				}
				const growThreads = Math.max(
					1,
					Math.min(
						totalPossibleGrowThreads,
						Math.ceil(
							this.ns.growthAnalyze(this.target.name, targetGrowPercent)
						)
					)
				)
				return {
					end: Infinity,
					endTicks: 1,
					id: ulid(),
					plans: [
						{
							direction: 'grow',
							end: Infinity,
							start: 0,
							threads: growThreads,
						},
					],
					start: 0,
					type: this.type,
				}
			}
			case 'weaken': {
				const securityDesired =
					expectedSecurityLevel - this.target.getMinSecurityLevel()
				const totalPossibleWeakenThreads = Math.floor(
					this.ramBudget / this.app.ramCost
				)
				const weakenThreads = Math.max(
					1,
					Math.min(
						Math.ceil(securityDesired / WeakenSecurityLowerPerThread),
						totalPossibleWeakenThreads
					)
				)
				let weakenTime = Infinity
				if (formulasExist) {
					const player = this.ns.getPlayer()
					const server = this.ns.getServer(this.target.name)
					weakenTime = this.ns.formulas.hacking.weakenTime(server, player)
				}
				return {
					end: weakenTime,
					endTicks: 1,
					id: ulid(),
					plans: [
						{
							direction: 'weaken',
							end: weakenTime,
							start: 0,
							threads: weakenThreads,
						},
					],
					start: 0,
					type: this.type,
				}
			}
			case 'hack': {
				const hackPercent = this.ns.hackAnalyze(this.target.name)
				const totalPossibleHackThreads = Math.floor(
					this.ramBudget / this.app.ramCost
				)
				const desiredMoney =
					expectedMoneyAvailable - this.target.getMoneyThreshold()
				const desiredHackPercent = desiredMoney / this.target.getWorth()
				const hackThreads = Math.max(
					1,
					Math.min(
						Math.ceil(
							Math.min(DesiredHackingSkim, desiredHackPercent) / hackPercent
						),
						totalPossibleHackThreads
					)
				)
				let hackTime = Infinity
				if (formulasExist) {
					const player = this.ns.getPlayer()
					const server = this.ns.getServer(this.target.name)
					hackTime = this.ns.formulas.hacking.hackTime(server, player)
				}
				return {
					end: hackTime,
					endTicks: 1,
					id: ulid(),
					plans: [
						{
							direction: 'hack',
							end: hackTime,
							start: 0,
							threads: hackThreads,
						},
					],
					start: 0,
					type: this.type,
				}
			}
			default:
				throw new Error(
					`Unsupported target direction ${this.target.getTargetDirection()}`
				)
		}
	}
}
