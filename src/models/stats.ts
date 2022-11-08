const targetHackingLevelMultiplier = 1 / 3

export class Stats {
	public readonly hackingLevel: number

	constructor(private ns: NS) {
		this.hackingLevel = this.ns.getHackingLevel()
	}

	getTargetHackingLevel() {
		return Math.max(1, this.hackingLevel * targetHackingLevelMultiplier)
	}
}
