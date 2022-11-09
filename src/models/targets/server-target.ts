import { DeployTarget } from './deploy-target'
import { slowlist } from './lazy-target'
import { Target } from './target'

/**
 * Server Target uses get server to bulk load server information
 */
export class ServerTarget extends DeployTarget implements Target {
	private server: Server
	public readonly hackingLevel: number
	public readonly purchasedNumber: number | null
	public readonly isSlow: boolean
	public readonly purchased: boolean

	constructor(ns: NS, name: string) {
		super(ns, name)

		this.server = this.ns.getServer(this.name)
		this.purchased = this.server.purchasedByPlayer

		this.hackingLevel = this.server.requiredHackingSkill
		this.isSlow = slowlist.has(this.name)
		this.purchasedNumber = this.purchased
			? Number(this.name.split('-')[1])
			: null
	}

	getHackingPorts() {
		return this.server.numOpenPortsRequired
	}

	getMaxRam() {
		return this.server.maxRam
	}

	getRooted() {
		return this.server.hasAdminRights
	}

	checkRooted() {
		if (this.server.hasAdminRights) {
			return this.server.hasAdminRights
		}
		this.server = this.ns.getServer(this.name)
		return this.server.hasAdminRights
	}

	checkUsedRam() {
		this.server = this.ns.getServer(this.name)
		return this.server.ramUsed
	}

	// *** Simple Target overrides ***

	getMinSecurityLevel(): number {
		return this.server.minDifficulty
	}

	getWorth(): number {
		return this.server.moneyMax
	}

	checkMoneyAvailable(): number {
		this.server = this.ns.getServer(this.name)
		return this.server.moneyAvailable
	}

	checkSecurityLevel(): number {
		this.server = this.ns.getServer(this.name)
		return this.server.hackDifficulty
	}
}
