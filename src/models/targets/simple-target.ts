export type TargetDirection = 'weaken' | 'grow' | 'hack'
export type BatchDirection = 'weaken' | 'grow' | 'batch'

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
	private batchDirection: BatchDirection = 'weaken'

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

	getBatchDirection() {
		return this.batchDirection
	}

	/**
	 * Finds the next Batch direction
	 *
	 * Batch direction is a similar state machine to Target Direction for Batch preparation
	 *
	 * ```
	 * weaken [start; preparation]
	 * weaken -> grow [weakened; low on money]
	 * weaken -> batch [weakened; full on money]
	 * grow -> weaken [high on security]
	 * grow -> batch [UNLIKELY: weakened and full on money]
	 * batch -> weaken [SAFE ZONE: desync either high security or low money]
	 * ```
	 *
	 * @param safeZone Check for desync
	 * @returns State has changed
	 */
	updateBatchDirection(safeZone = true) {
		const securityLevel = this.checkSecurityLevel()
		const money = this.checkMoneyAvailable()
		switch (this.batchDirection) {
			case 'weaken':
				if (securityLevel <= this.getMinSecurityLevel()) {
					if (money >= this.getWorth()) {
						this.batchDirection = 'batch'
						return true
					} else {
						this.batchDirection = 'grow'
						return true
					}
				}
				break
			case 'grow':
				if (
					securityLevel > this.getSecurityThreshold() ||
					money >= this.getWorth()
				) {
					if (
						money >= this.getWorth() &&
						securityLevel <= this.getMinSecurityLevel()
					) {
						this.batchDirection = 'batch'
						return true
					} else {
						this.batchDirection = 'weaken'
						return true
					}
				}
				break
			case 'batch':
				if (
					safeZone &&
					(securityLevel > this.getSecurityThreshold() ||
						money < this.getMoneyThreshold())
				) {
					this.ns.tprint(`WARN ${this.name} desync`)
					this.batchDirection = 'weaken'
					return true
				}
				break
		}
		return false
	}
}
