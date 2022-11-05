export class Server {
	private hackingLevel: number | null = null
	private hackingPorts: number | null = null
	private maxRam: number | null = null
	private worth: number | null = null
	private isRooted: boolean

	constructor(private ns: NS, private name: string, private purchased = false) {
		this.isRooted = this.ns.hasRootAccess(this.name)
	}

	getName() {
		return this.name
	}

	getPurchased() {
		return this.purchased
	}

	getHackingLevel() {
		if (this.hackingLevel === null) {
			this.hackingLevel = this.ns.getServerRequiredHackingLevel(this.name)
		}
		return this.hackingLevel
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

	getWorth() {
		if (this.worth === null) {
			this.worth = this.ns.getServerMaxMoney(this.name)
		}
		return this.worth
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
}
