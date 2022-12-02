import { DeployTarget } from './deploy-target'
import { Target } from './target'

/**
 * Server Target uses get server to bulk load server information
 */
export class ServerTarget extends DeployTarget implements Target {
	private server: Server
	public readonly hackingLevel: number
	public readonly purchasedNumber: number | null
	public readonly purchased: boolean

	constructor(ns: NS, name: string, _purchased: boolean) {
		super(ns, name)

		this.server = this.ns.getServer(this.name)
		this.purchased = this.server.purchasedByPlayer

		this.hackingLevel = this.server.requiredHackingSkill
		this.purchasedNumber = this.purchased
			? Number(this.name.split('-')[1])
			: null
	}

	getServer() {
		this.server = this.ns.getServer(this.name)
		return this.server
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
