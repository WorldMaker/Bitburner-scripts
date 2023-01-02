import { Company, MyCompany } from '../../models/corporation'
import { NsLogger } from '../../logging/logger'
import { BasePhaseManager } from './base-phase'
import { PhaseManager } from './phase'

const DesiredResearch = [
	'Hi-Tech R&D Laboratory',
	'Market-TA.I',
	'Market-TA.II',
]
const DesiredOffer = 10_000_000_000_000_000

export class ProductRound3Manager
	extends BasePhaseManager
	implements PhaseManager
{
	private researchDesired = 0
	private researchMet = 0

	constructor(ns: NS, logger: NsLogger, company: Company) {
		super(ns, logger, company)
	}

	summarize() {
		return `INFO preparing ${MyCompany.ProductDivision.Name} for fourth investment round; ${this.researchMet}/${this.researchDesired}`
	}

	async manage(): Promise<void> {
		const productDivision = this.company.getProductDivision()
		if (!productDivision) {
			this.logger.error`no product division`
			return
		}

		const availableResearch = productDivision.research
		for (const research of DesiredResearch) {
			this.researchDesired++
			if (this.ns.corporation.hasResearched(productDivision.name, research)) {
				this.researchMet++
			} else {
				const cost = this.ns.corporation.getResearchCost(
					productDivision.name,
					research
				)
				// we want to leave some research, so see that we can pay for at least twice the cost
				if (availableResearch > cost * 2) {
					this.ns.corporation.research(productDivision.name, research)
					this.researchMet++

					// turn Market-TA.II on all our products as soon as acquired
					if (research === 'Market-TA.II') {
						for (const product of productDivision.products) {
							try {
								this.ns.corporation.setProductMarketTA2(
									productDivision.name,
									product,
									true
								)
							} catch (error) {
								this.logger
									.warn`unable to set Market TA2 on ${productDivision.name} ${product}: ${error}`
							}
						}
					}
				}
			}
		}

		if (this.researchMet < this.researchDesired) {
			this.logger.log('Waiting for research to complete')
			return
		}

		if (!this.checkMorale(productDivision)) {
			return
		}

		this.invest(DesiredOffer)
	}
}
