import {
	Company,
	LevelUpgrade,
	LevelUpgrades,
	MyCompany,
} from '../../models/corporation'
import { Logger } from '../../models/logger'
import { BasePhaseManager } from './base-phase'
import { PhaseManager } from './phase'

const DesiredLevelUpgrades: Partial<Record<LevelUpgrade, number>> = {
	[LevelUpgrades.DreamSense]: 30,
	[LevelUpgrades.FocusWires]: 20,
	[LevelUpgrades.NeuralAccelerators]: 20,
	[LevelUpgrades.SpeechProcessorImplants]: 20,
	[LevelUpgrades.Nuoptimal]: 20,
	[LevelUpgrades.ProjectInsight]: 10,
}
const DesiredOffer = 100_000_000_000_000

export class ProductRound2Manager
	extends BasePhaseManager
	implements PhaseManager
{
	constructor(ns: NS, logger: Logger, company: Company) {
		super(ns, logger, company)
	}

	summarize() {
		return `INFO preparing ${MyCompany.ProductDivision.Name} for third investment round; ${this.levelsMet}/${this.levelsDesired}`
	}

	async manage(): Promise<void> {
		const productDivision = this.company.getProductDivision()
		if (!productDivision) {
			this.logger.log(`ERROR no product division`)
			return
		}

		this.manageLevelUpgrades(DesiredLevelUpgrades)

		// *** Make sure needs above are met ***

		if (this.levelsMet < this.levelsDesired) {
			this.logger.log('Waiting for current needs to be met')
			return
		}

		if (!this.checkMorale(productDivision)) {
			return
		}

		this.invest(DesiredOffer)
	}
}
