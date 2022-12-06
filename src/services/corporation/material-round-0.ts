import {
	BoostMaterial,
	BoostMaterials,
	Company,
	LevelUpgrade,
	LevelUpgrades,
	MyCompany,
} from '../../models/corporation'
import { Logger } from '../../models/logger'
import { MaterialPhaseManager } from './material-phase'
import { PhaseManager } from './phase'

const DesiredWarehouseLevel = 3
const DesiredLevelUpgrades: Partial<Record<LevelUpgrade, number>> = {
	[LevelUpgrades.FocusWires]: 2,
	[LevelUpgrades.NeuralAccelerators]: 2,
	[LevelUpgrades.SpeechProcessorImplants]: 2,
	[LevelUpgrades.Nuoptimal]: 2,
	[LevelUpgrades.SmartFactories]: 2,
}
const DesiredMaterial: Partial<Record<BoostMaterial, number>> = {
	[BoostMaterials.Hardware]: 125,
	[BoostMaterials.AiCores]: 75,
	[BoostMaterials.RealEstate]: 27_000,
}
const DesiredOffer = 100_000_000_000

export class MaterialRound0Manager
	extends MaterialPhaseManager
	implements PhaseManager
{
	constructor(ns: NS, logger: Logger, company: Company) {
		super(ns, logger, company)
	}

	summarize() {
		return `INFO preparing ${MyCompany.MaterialDivision.Name} for first investment round; ${this.levelsMet}/${this.levelsDesired}; ${this.warehouseLevelsMet}/${this.warehouseLevelsDesired}; ${this.materialsMet}/${this.materialsDesired}`
	}

	async manage(): Promise<void> {
		const materialDivision = this.company.getMaterialDivision()
		if (!materialDivision) {
			this.logger.log(`ERROR no material division`)
			return
		}

		this.manageLevelUpgrades(DesiredLevelUpgrades)
		this.manageWarehouseLevel(materialDivision, DesiredWarehouseLevel)
		await this.manageMaterials(materialDivision, DesiredMaterial)

		// *** Make sure needs above are met ***

		if (
			this.levelsMet < this.levelsDesired ||
			this.warehouseLevelsMet < this.warehouseLevelsDesired ||
			this.materialsMet < this.materialsDesired
		) {
			this.logger.log('Waiting for current needs to be met')
			return
		}

		if (!this.checkMorale(materialDivision)) {
			return
		}

		this.invest(DesiredOffer)
	}
}
