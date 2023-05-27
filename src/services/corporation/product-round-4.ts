import { Company } from '../../models/corporation'
import { PhaseManager } from './phase'

const PublicShares = 0
const Dividends = 0.05 /* percent */

export class ProductRound4Manager implements PhaseManager {
	constructor(private readonly company: Company) {}

	summarize() {
		const { logger } = this.company.context
		logger.info`preparing ${this.company.name} to go Public`
	}

	async manage(): Promise<void> {
		const { ns, logger } = this.company.context
		if (ns.corporation.goPublic(PublicShares)) {
			logger.hooray`${this.company.name} went Public`
			ns.corporation.issueDividends(Dividends)
		} else {
			logger.error`${this.company.name} was unable to go public`
		}

		if (this.company.context.hacknetHashStrategy.startsWith('corp')) {
			this.company.context.hacknetHashStrategy = 'money'
		}

		this.company.context.hasPublicCompany = true
	}
}
