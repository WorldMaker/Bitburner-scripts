export type TargetDirection = 'weaken' | 'grow' | 'hack'

const moneyThresholdMultiplier = 0.75
const securityThresholdOverage = 5

/**
 * Simple Target is the minimal server API for use in payload-all
 */
export class SimpleTarget {
	private worth: number | null = null
	private moneyThreshold: number | null = null
	private securityThreshold: number | null = null
	private minSecurityLevel: number | null = null
	private targetDirection: TargetDirection = 'weaken'
	private readonly parents = new Set<string>()

	constructor(
		protected ns: NS,
		public readonly name: string,
		public readonly hackingLevel: number = Infinity,
		public readonly purchasedNumber: number | null = null,
		public readonly purchased: boolean = false
	) {}

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

	addParent(name: string): void {
		this.parents.add(name)
	}

	getParents(): Iterable<string> {
		return this.parents.values()
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
	 * grow -> weaken [has enough money or high security]
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
					if (money >= this.getWorth()) {
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
					this.targetDirection = 'weaken'
					return true
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

	// *** Not Implemented ***
	getServer(): Server {
		throw new Error('Not implemented in base Target')
	}
	getHackingPorts(): number {
		throw new Error('Not implemented in base Target')
	}
	getMaxRam(): number {
		throw new Error('Not implemented in base Target')
	}
	getRooted(): boolean {
		throw new Error('Not implemented in base Target')
	}
	checkRooted(): boolean {
		throw new Error('Not implemented in base Target')
	}
	checkUsedRam(): number {
		throw new Error('Not implemented in base Target')
	}
}
