import { DesiredHackingSkim } from './hackmath'
import { Target } from './target'

const targetHackingLevelMultiplier = 1 / 3

export interface Stats {
	readonly hackingLevel: number
	readonly formulasExist: boolean
	getTargetHackingLevel(): number
	getTargetEfficiency(target: Target): number
	isTargetHackable(target: Target): boolean
}

export class PlayerStats implements Stats {
	protected player: Player
	public readonly hackingLevel: number
	public readonly formulasExist: boolean

	constructor(protected ns: NS) {
		this.player = this.ns.getPlayer()
		this.hackingLevel = this.player.skills.hacking
		this.formulasExist = this.ns.fileExists('Formulas.exe')
	}

	getPlayer() {
		return this.player
	}

	getTargetHackingLevel() {
		return Math.max(1, this.hackingLevel * targetHackingLevelMultiplier)
	}

	isTargetHackable(target: Target): boolean {
		if (this.formulasExist) {
			const server = target.getServer()
			if (
				this.ns.formulas.hacking.hackChance(
					{ ...server, hackDifficulty: server.minDifficulty },
					this.player
				) >= 1
			) {
				return true
			}
		}
		return (
			this.ns.hackAnalyzeChance(target.name) >= 1 ||
			target.hackingLevel <= this.getTargetHackingLevel()
		)
	}

	getTargetEfficiency(target: Target): number {
		if (this.formulasExist) {
			const server = target.getServer()
			return (
				(target.getWorth() * DesiredHackingSkim) /
				this.ns.formulas.hacking.hackTime(server, this.player)
			)
		}
		return target.getWorth() * DesiredHackingSkim
	}
}
