import { Company } from '../../models/corporation'
import { NsLogger } from '../../logging/logger'
import { PhaseManager } from './phase'

const PublicShares = 0
const Dividends = 0.05 /* percent */

export class ProductRound4Manager implements PhaseManager {
	constructor(
		private ns: NS,
		private logger: NsLogger,
		private company: Company
	) {}

	summarize(): string {
		return `INFO preparing ${this.company.name} to go Public`
	}

	async manage(): Promise<void> {
		if (this.ns.corporation.goPublic(PublicShares)) {
			this.logger.hooray`${this.company.name} went Public`
			this.ns.corporation.issueDividends(Dividends)
		} else {
			this.logger.error`${this.company.name} was unable to go public`
		}
	}
}
