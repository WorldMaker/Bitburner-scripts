export type TargetDirection = 'weaken' | 'grow' | 'hack'

const moneyThresholdMultiplier = 0.75
const securityThresholdOverage = 5

export type TargetFactory<T extends Target> = (
	ns: NS,
	name: string,
	purchased?: boolean
) => T

/**
 * The base Target is the minimal server API for use in payload-all
 */
export abstract class Target {
	private moneyThreshold: number | null = null
	private securityThreshold: number | null = null
	private targetDirection: TargetDirection = 'weaken'
	private readonly parents = new Set<string>()
	public readonly purchasedNumber: number | null

	constructor(
		protected ns: NS,
		public readonly name: string,
		public readonly purchased: boolean = false
	) {
		this.purchasedNumber = purchased ? Number(name.split('-')[1]) : null
	}

	abstract getWorth(): number

	getMoneyThreshold(): number {
		if (this.moneyThreshold === null) {
			this.moneyThreshold = this.getWorth() * moneyThresholdMultiplier
		}
		return this.moneyThreshold
	}

	abstract getMinSecurityLevel(): number

	getSecurityThreshold() {
		if (this.securityThreshold === null) {
			this.securityThreshold =
				this.getMinSecurityLevel() + securityThresholdOverage
		}
		return this.securityThreshold
	}

	abstract checkSecurityLevel(): number
	abstract checkMoneyAvailable(): number

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
}
