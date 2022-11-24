import { Target } from './target'

const targetHackingLevelMultiplier = 1 / 3

export interface Stats {
	readonly hackingLevel: number
	readonly formulasExist: boolean
	getTargetHackingLevel(): number
	isTargetHackable(target: Target): boolean
}

export class SimpleStats implements Stats {
	public readonly hackingLevel: number
	public readonly formulasExist: boolean

	constructor(private ns: NS) {
		this.hackingLevel = this.ns.getHackingLevel()
		this.formulasExist = this.ns.fileExists('Formulas.exe')
	}

	getTargetHackingLevel() {
		return Math.max(1, this.hackingLevel * targetHackingLevelMultiplier)
	}

	isTargetHackable(target: Target): boolean {
		if (this.formulasExist) {
			const player = this.ns.getPlayer()
			const server = this.ns.getServer(target.name)
			if (this.ns.formulas.hacking.hackChance(server, player) >= 1) {
				return true
			}
		}
		return target.hackingLevel <= this.getTargetHackingLevel()
	}
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
			const server = this.ns.getServer(target.name)
			if (this.ns.formulas.hacking.hackChance(server, this.player) >= 1) {
				return true
			}
		}
		return target.hackingLevel <= this.getTargetHackingLevel()
	}
}
