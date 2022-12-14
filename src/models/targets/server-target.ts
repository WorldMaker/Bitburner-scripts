import { DeployTarget } from './deploy-target'

/**
 * Server Target uses get server to bulk load server information
 */
export class ServerTarget extends DeployTarget {
	private server: Server

	constructor(ns: NS, name: string, _purchased: boolean) {
		const server = ns.getServer(name)
		const purchased = server.purchasedByPlayer

		super(ns, name, server.requiredHackingSkill, purchased)

		this.server = server
	}

	getServer() {
		this.server = this.ns.getServer(this.name)
		return this.server
	}

	getHackingPorts() {
		return this.server.numOpenPortsRequired
	}

	getMaxRam(recheck = false) {
		if (recheck) {
			this.server = this.ns.getServer(this.name)
		}
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
