import { Company } from '../../models/corporation'
import { PhaseManager } from './phase'
import { NsContext } from '../../models/context'

const PublicShares = 0
const Dividends = 0.05 /* percent */

export class ProductRound4Manager implements PhaseManager {
	constructor(private context: NsContext, private company: Company) {}

	summarize(): string {
		return `INFO preparing ${this.company.name} to go Public`
	}

	async manage(): Promise<void> {
		const { ns, logger } = this.context
		if (ns.corporation.goPublic(PublicShares)) {
			logger.hooray`${this.company.name} went Public`
			ns.corporation.issueDividends(Dividends)
		} else {
			logger.error`${this.company.name} was unable to go public`
		}

		if (this.context.hacknetHashStrategy.startsWith('corp')) {
			this.context.hacknetHashStrategy = 'money'
		}
	}
}
