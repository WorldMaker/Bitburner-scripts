import { DeployTarget } from './deploy-target'
import { Target } from './target'

/**
 * Lazy Target is entirely "pay-per-play" when looking up Server information
 */
export class LazyTarget extends DeployTarget implements Target {
	public readonly hackingLevel: number
	private hackingPorts: number | null = null
	private maxRam: number | null = null
	private isRooted: boolean
	public readonly purchasedNumber: number | null

	constructor(ns: NS, name: string, public readonly purchased: boolean) {
		super(ns, name)
		this.hackingLevel = this.ns.getServerRequiredHackingLevel(this.name)
		this.isRooted = this.ns.hasRootAccess(this.name)
		this.purchasedNumber = purchased ? Number(this.name.split('-')[1]) : null
	}

	getServer() {
		return this.ns.getServer(this.name)
	}

	getHackingPorts() {
		if (this.hackingPorts === null) {
			this.hackingPorts = this.ns.getServerNumPortsRequired(this.name)
		}
		return this.hackingPorts
	}

	getMaxRam() {
		if (this.maxRam === null) {
			this.maxRam = this.ns.getServerMaxRam(this.name)
		}
		return this.maxRam
	}

	getRooted() {
		return this.isRooted
	}

	checkRooted() {
		if (this.isRooted) {
			return this.isRooted
		}
		this.isRooted = this.ns.hasRootAccess(this.name)
		return this.isRooted
	}

	checkUsedRam() {
		return this.ns.getServerUsedRam(this.name)
	}
}
