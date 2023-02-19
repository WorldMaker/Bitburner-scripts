import { DesiredHackingSkim } from './hackmath'
import { ServerTarget } from './targets/server-target'

const targetHackingLevelMultiplier = 1 / 2

export class PlayerStats {
	protected player: Player
	public readonly formulasExist: boolean

	constructor(protected ns: NS) {
		this.player = this.ns.getPlayer()
		this.formulasExist = this.ns.fileExists('Formulas.exe')
	}

	getPlayer() {
		return this.player
	}

	get hackingLevel() {
		return this.player.skills.hacking
	}

	getTargetHackingLevel() {
		return Math.max(1, this.hackingLevel * targetHackingLevelMultiplier)
	}

	isTargetHackable(target: ServerTarget): boolean {
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

	getTargetEfficiency(target: ServerTarget): number {
		if (this.formulasExist) {
			const server = target.getServer()
			return (
				(target.getWorth() * DesiredHackingSkim) /
				this.ns.formulas.hacking.hackTime(
					{
						...server,
						hackDifficulty: server.minDifficulty,
					},
					this.player
				)
			)
		}
		return (
			(target.getWorth() * DesiredHackingSkim) / target.getMinSecurityLevel()
		)
	}
}
