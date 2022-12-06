import { Company } from '../../models/corporation'
import { Logger } from '../../models/logger'
import { PhaseManager } from './phase'

const PublicShares = 0
const Dividends = 5 /* percent */

export class ProductRound4Manager implements PhaseManager {
	constructor(
		private ns: NS,
		private logger: Logger,
		private company: Company
	) {}

	summarize(): string {
		return `INFO preparing ${this.company.name} to go Public`
	}

	async manage(): Promise<void> {
		if (this.ns.corporation.goPublic(PublicShares)) {
			this.logger.log(`SUCCESS ${this.company.name} went Public`)
			this.ns.corporation.issueDividends(Dividends)
		} else {
			this.logger.log(`ERROR ${this.company.name} was unable to go public`)
		}
	}
}
