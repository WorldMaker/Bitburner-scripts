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

/**
 * Base Server is the minimal server API for possible use in payload-all
 */
export class BaseServer {
	private worth: number | null = null
	private moneyThreshold: number | null = null
	private securityThreshold: number | null = null
	private minSecurityLevel: number | null = null
	private targetDirection: TargetDirection = 'weaken'

	constructor(protected ns: NS, public readonly name: string) {}

	getWorth() {
		if (this.worth === null) {
			this.worth = this.ns.getServerMaxMoney(this.name)
		}
		return this.worth
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

	getTargetDirection() {
		return this.targetDirection
	}

	/**
	 * Finds the next target direction
	 *
	 * Target direction is a simple state machine based on [security, money].
	 *
	 * ```
	 * weaken [start]
	 * weaken -> grow [low on money]
	 * weaken -> hack [has enough money]
	 * grow -> weaken [high security]
	 * grow -> hack [has enough money]
	 * hack -> weaken [low on money or high security; cycle]
	 * ```
	 *
	 * @returns Is new direction
	 */
	updateTargetDirection() {
		const securityLevel = this.checkSecurityLevel()
		const money = this.checkMoneyAvailable()
		switch (this.targetDirection) {
			case 'weaken':
				if (Math.round(securityLevel) === this.getMinSecurityLevel()) {
					if (money > this.getMoneyThreshold()) {
						this.targetDirection = 'hack'
						return true
					} else {
						this.targetDirection = 'grow'
						return true
					}
				}
				break
			case 'grow':
				if (
					securityLevel > this.getSecurityThreshold() ||
					money >= this.getWorth()
				) {
					if (money > this.getMoneyThreshold()) {
						this.targetDirection = 'hack'
						return true
					} else {
						this.targetDirection = 'weaken'
						return true
					}
				}
				break
			case 'hack':
				if (
					securityLevel > this.getSecurityThreshold() ||
					money < this.getMoneyThreshold()
				) {
					this.targetDirection = 'weaken'
					return true
				}
				break
		}
		return false
	}
}

export class Server extends BaseServer {
	public readonly hackingLevel: number
	private hackingPorts: number | null = null
	private maxRam: number | null = null
	private isRooted: boolean
	public readonly purchasedNumber: number | null
	public readonly isSlow: boolean

	constructor(ns: NS, name: string, public readonly purchased = false) {
		super(ns, name)
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

	isRunning(script: FilenameOrPID, ...args: (string | number | boolean)[]) {
		return this.ns.isRunning(script, this.name, ...args)
	}

	scp(files: string | string[], source?: string) {
		return this.ns.scp(files, this.name, source)
	}

	killall(safetyGuard?: boolean) {
		return this.ns.killall(this.name, safetyGuard)
	}

	kill(script: string, ...args: (string | number | boolean)[]) {
		return this.ns.kill(script, this.name, ...args)
	}

	exec(script: string, threads = 1, ...args: (string | number | boolean)[]) {
		return this.ns.exec(script, this.name, threads, ...args)
	}

	checkUsedRam() {
		return this.ns.getServerUsedRam(this.name)
	}
}
