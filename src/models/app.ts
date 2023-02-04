import { Target, TargetDirection } from './targets'

export const BatchPayloadG = 'payload-bg.js'
export const BatchPayloadH = 'payload-bh.js'
export const BatchPayloadW = 'payload-bw.js'
export const PayloadAll = 'payload-all.js'
export const PayloadG = 'payload-g.js'
export const PayloadH = 'payload-h.js'
export const PayloadW = 'payload-w.js'
export const SalvoPayloadG = 'payload-sg.js'
export const SalvoPayloadH = 'payload-sh.js'
export const SalvoPayloadW = 'payload-sw.js'

export function getBatchPayloadDirection(
	payloadName: string
): TargetDirection | undefined {
	switch (payloadName) {
		case BatchPayloadG:
			return 'grow'
		case BatchPayloadH:
			return 'hack'
		case BatchPayloadW:
			return 'weaken'
		default:
			return undefined
	}
}

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
