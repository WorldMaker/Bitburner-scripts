import { NsContext } from '../models/context'
import { ToyBudgetProvider } from '../models/toys'

const HacknetToyFunds = 100_000 // ~=10% of 1,000,000

export class HacknetHashService implements ToyBudgetProvider {
	readonly name = 'hashes'
	#hashes = 0
	#hashCost = 0
	#soldForMoney = 0

	constructor(private readonly context: NsContext) {}

	budget(funds: number): number {
		const budget = this.#soldForMoney * HacknetToyFunds
		this.#soldForMoney = 0
		if (budget < funds) {
			return budget
		}
		return 0
	}

	summarize() {
		const { ns, logger } = this.context
		if (this.context.hacknetHashStrategy.length) {
			logger.info`spending hashes for ${this.context.hacknetHashStrategy}; ${
				this.#soldForMoney
			}x ${ns.formatNumber(this.#hashes)}/${ns.formatNumber(this.#hashCost)}`
		}
	}

	manage() {
		const { ns } = this.context
		this.#hashes = ns.hacknet.numHashes()

		switch (this.context.hacknetHashStrategy) {
			case 'money':
				this.#hashCost = ns.hacknet.hashCost('Sell for Money')
				while (this.#hashes > this.#hashCost) {
					ns.hacknet.spendHashes('Sell for Money')
					this.#hashes -= this.#hashCost
					this.#soldForMoney++
				}
				break
			case 'corpfunds':
				this.#hashCost = ns.hacknet.hashCost('Sell for Corporation Funds')
				while (this.#hashes > this.#hashCost) {
					ns.hacknet.spendHashes('Sell for Corporation Funds')
					this.#hashes -= this.#hashCost
				}
				break
			case 'corpresearch':
				this.#hashCost = ns.hacknet.hashCost(
					'Exchange for Corporation Research'
				)
				while (this.#hashes > this.#hashCost) {
					ns.hacknet.spendHashes('Exchange for Corporation Research')
					this.#hashes -= this.#hashCost
				}
				break
		}
	}
}
