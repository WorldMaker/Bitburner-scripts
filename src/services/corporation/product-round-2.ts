import {
	Company,
	LevelUpgrade,
	LevelUpgrades,
	MyCompany,
} from '../../models/corporation'
import { BasePhaseManager } from './base-phase'
import { PhaseManager } from './phase'

const DesiredLevelUpgrades: Partial<Record<LevelUpgrade, number>> = {
	[LevelUpgrades.DreamSense]: 30,
	[LevelUpgrades.FocusWires]: 20,
	[LevelUpgrades.NeuralAccelerators]: 20,
	[LevelUpgrades.SpeechProcessorImplants]: 20,
	[LevelUpgrades.Nuoptimal]: 20,
	[LevelUpgrades.ProjectInsight]: 10,
	[LevelUpgrades.SalesBots]: 1,
}
const DesiredOffer = 100_000_000_000_000

export class ProductRound2Manager
	extends BasePhaseManager
	implements PhaseManager
{
	constructor(company: Company) {
		super(company)
	}

	summarize() {
		const { logger } = this.company.context
		logger.info`preparing ${MyCompany.ProductDivision.Name} for third investment round; ${this.levelsMet}/${this.levelsDesired}`
	}

	async manage(): Promise<void> {
		const { logger } = this.company.context
		const productDivision = this.company.getProductDivision()
		if (!productDivision) {
			logger.error`no product division`
			return
		}

		if (this.company.hasDevelopedProduct()) {
			DesiredLevelUpgrades[LevelUpgrades.WilsonAnalytics] = 10
		} else {
			// count the levels even though we aren't yet buying them
			this.levelsDesired += 10
		}

		this.manageLevelUpgrades(DesiredLevelUpgrades)

		// *** Make sure needs above are met ***

		if (this.levelsMet < this.levelsDesired) {
			logger.log('Waiting for current needs to be met')
			return
		}

		if (this.company.context.hacknetHashStrategy === 'corpfunds') {
			this.company.context.hacknetHashStrategy = 'corpresearch'
		}

		if (!this.checkMorale(productDivision)) {
			return
		}

		this.invest(DesiredOffer)
	}
}
