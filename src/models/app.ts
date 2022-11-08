import { Server } from './server'

export class App {
	public readonly ramCost: number

	constructor(
		private ns: NS,
		public readonly name: string,
		public readonly needsSecurityThreshold = false,
		public readonly needsMoneyThreshold = false
	) {
		this.ramCost = this.ns.getScriptRam(this.name)
	}

	getArgs(target: Server) {
		return [
			...(this.needsSecurityThreshold ? [target.getSecurityThreshold()] : []),
			...(this.needsMoneyThreshold ? [target.getMoneyThreshold()] : []),
		]
	}
}
