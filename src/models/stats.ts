import { ServerTarget } from './targets/server-target'

const targetHackingLevelMultiplier = 1 / 3

export interface Stats {
	readonly hackingLevel: number
	getTargetHackingLevel(): number
}

export class SimpleStats implements Stats {
	public readonly hackingLevel: number

	constructor(private ns: NS) {
		this.hackingLevel = this.ns.getHackingLevel()
	}

	getTargetHackingLevel() {
		return Math.max(1, this.hackingLevel * targetHackingLevelMultiplier)
	}
}

export class PlayerStats implements Stats {
	protected player: Player
	public readonly hackingLevel: number

	constructor(protected ns: NS) {
		this.player = this.ns.getPlayer()
		this.hackingLevel = this.player.skills.hacking
	}

	getTargetHackingLevel() {
		return Math.max(1, this.hackingLevel * targetHackingLevelMultiplier)
	}
}
