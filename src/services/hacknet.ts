import { NsLogger } from '../logging/logger'
import { Config } from '../models/config'
import { ToyBudgetProvider } from '../models/toys'

const HacknetToyFunds = 100_000 // ~=10% of 1,000,000

export class HacknetHashService implements ToyBudgetProvider {
	readonly name = 'hashes'
	#hashes = 0
	#hashCost = 0
	#soldForMoney = 0

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger
	) {}

	budget(funds: number): number {
		const budget = this.#soldForMoney * HacknetToyFunds
		this.#soldForMoney = 0
		if (budget < funds) {
			return budget
		}
		return 0
	}

	summarize() {
		if (this.config.hacknetHashStrategy.length) {
			this.logger.info`spending hashes for ${
				this.config.hacknetHashStrategy
			}; ${this.#soldForMoney}x ${this.ns.formatNumber(
				this.#hashes
			)}/${this.ns.formatNumber(this.#hashCost)}`
		}
	}

	manage() {
		this.#hashes = this.ns.hacknet.numHashes()

		switch (this.config.hacknetHashStrategy) {
			case 'money':
				this.#hashCost = this.ns.hacknet.hashCost('Sell for Money')
				while (this.#hashes > this.#hashCost) {
					this.ns.hacknet.spendHashes('Sell for Money')
					this.#hashes -= this.#hashCost
					this.#soldForMoney++
				}
				break
			case 'corpfunds':
				this.#hashCost = this.ns.hacknet.hashCost('Sell for Corporation Funds')
				while (this.#hashes > this.#hashCost) {
					this.ns.hacknet.spendHashes('Sell for Corporation Funds')
					this.#hashes -= this.#hashCost
				}
				break
			case 'corpresearch':
				this.#hashCost = this.ns.hacknet.hashCost(
					'Exchange for Corporation Research'
				)
				while (this.#hashes > this.#hashCost) {
					this.ns.hacknet.spendHashes('Exchange for Corporation Research')
					this.#hashes -= this.#hashCost
				}
				break
		}
	}
}
