export class App {
	public readonly ramCost: number

	constructor(private ns: NS, public readonly name: string) {
		this.ramCost = this.ns.getScriptRam(this.name)
	}
}
