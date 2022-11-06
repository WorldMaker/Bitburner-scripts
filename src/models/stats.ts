export class Stats {
	public readonly hackingLevel: number

	constructor(private ns: NS) {
		this.hackingLevel = this.ns.getHackingLevel()
	}
}
