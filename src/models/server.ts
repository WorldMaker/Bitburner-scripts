export type TargetDirection = 'weaken' | 'grow' | 'hack'

const moneyThresholdMultiplier = 0.75
const securityThresholdOverage = 5

const slowlist = new Set([
	'millenium-fitness',
	'catalyst',
	'rothman-uni',
	'silver-helix',
	'I.I.I.I',
	'netlink',
])

export class Server {
	public readonly hackingLevel: number
	private hackingPorts: number | null = null
	private maxRam: number | null = null
	private worth: number | null = null
	private moneyThreshold: number | null = null
	private minSecurityLevel: number | null = null
	private securityThreshold: number | null = null
	private isRooted: boolean
	public readonly purchasedNumber: number | null
	public readonly isSlow: boolean

	constructor(
		private ns: NS,
		public readonly name: string,
		public readonly purchased = false
	) {
		this.hackingLevel = this.ns.getServerRequiredHackingLevel(this.name)
		this.isRooted = this.ns.hasRootAccess(this.name)
		this.isSlow = slowlist.has(this.name)
		this.purchasedNumber = purchased ? Number(this.name.split('-')[1]) : null
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

	getMoneyThreshold() {
		if (this.moneyThreshold === null) {
			this.moneyThreshold = this.getWorth() * moneyThresholdMultiplier
		}
		return this.moneyThreshold
	}

	getMinSecurityLevel() {
		if (this.minSecurityLevel === null) {
			this.minSecurityLevel = this.ns.getServerMinSecurityLevel(this.name)
		}
		return this.minSecurityLevel
	}

	getSecurityThreshold() {
		if (this.securityThreshold === null) {
			this.securityThreshold =
				this.getMinSecurityLevel() + securityThresholdOverage
		}
		return this.securityThreshold
	}

	checkSecurityLevel() {
		return this.ns.getServerSecurityLevel(this.name)
	}

	checkMoneyAvailable() {
		return this.ns.getServerMoneyAvailable(this.name)
	}

	isRunning(script: FilenameOrPID, ...args: (string | number | boolean)[]) {
		return this.ns.isRunning(script, this.name, ...args)
	}

	scp(files: string | string[], source?: string) {
		return this.ns.scp(files, this.name, source)
	}

	killall(safetyGuard?: boolean) {
		return this.ns.killall(this.name, safetyGuard)
	}

	exec(script: string, threads = 1, ...args: (string | number | boolean)[]) {
		return this.ns.exec(script, this.name, threads, ...args)
	}

	checkUsedRam() {
		return this.ns.getServerUsedRam(this.name)
	}
}
