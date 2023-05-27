import { Company, MyCompany } from '../../models/corporation'
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

	constructor(company: Company) {
		super(company)
	}

	summarize() {
		const { logger } = this.company.context
		logger.info`preparing ${MyCompany.ProductDivision.Name} for fourth investment round; ${this.researchMet}/${this.researchDesired}`
	}

	async manage(): Promise<void> {
		const { ns, logger } = this.company.context
		const productDivision = this.company.getProductDivision()
		if (!productDivision) {
			logger.error`no product division`
			return
		}

		if (this.company.context.hacknetHashStrategy === 'corpfunds') {
			this.company.context.hacknetHashStrategy = 'corpresearch'
		}

		const availableResearch = productDivision.researchPoints
		for (const research of DesiredResearch) {
			this.researchDesired++
			if (ns.corporation.hasResearched(productDivision.name, research)) {
				this.researchMet++
			} else {
				const cost = ns.corporation.getResearchCost(
					productDivision.name,
					research
				)
				// we want to leave some research, so see that we can pay for at least twice the cost
				if (availableResearch > cost * 2) {
					ns.corporation.research(productDivision.name, research)
					this.researchMet++

					// turn Market-TA.II on all our products as soon as acquired
					if (research === 'Market-TA.II') {
						for (const product of productDivision.products) {
							try {
								ns.corporation.setProductMarketTA2(
									productDivision.name,
									product,
									true
								)
							} catch (error) {
								logger.warn`unable to set Market TA2 on ${productDivision.name} ${product}: ${error}`
							}
						}
					}
				}
			}
		}

		if (this.researchMet < this.researchDesired) {
			logger.log('Waiting for research to complete')
			return
		}

		if (!this.checkMorale(productDivision)) {
			return
		}

		this.invest(DesiredOffer)
	}
}
