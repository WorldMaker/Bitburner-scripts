import { NsLogger } from '../logging/logger'
import { Config } from '../models/config'

export class HacknetHashService {
	#hashes = 0
	#hashCost = 0

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger
	) {}

	summarize() {
		if (this.config.hacknetHashStrategy.length) {
			this.logger.info`spending hashes for ${
				this.config.hacknetHashStrategy
			}; ${this.ns.nFormat(this.#hashes, '0.00a')}/${this.ns.nFormat(
				this.#hashCost,
				'0.00a'
			)}`
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
