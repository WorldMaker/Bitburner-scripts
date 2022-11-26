import { Target } from './target'

export class App {
	public readonly ramCost: number

	constructor(
		private ns: NS,
		public readonly name: string,
		public readonly needsSecurityThreshold = false,
		public readonly needsMoneyThreshold = false,
		public readonly batch = false
	) {
		this.ramCost = this.ns.getScriptRam(this.name)
	}

	getArgs(target: Target) {
		return [
			this.batch ? 'batch' : 'start',
			target.name,
			...(this.needsSecurityThreshold ? [target.getSecurityThreshold()] : []),
			...(this.needsMoneyThreshold ? [target.getMoneyThreshold()] : []),
		]
	}
}
