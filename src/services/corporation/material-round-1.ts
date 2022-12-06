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

const DesiredWarehouseLevel = 10
const DesiredLevelUpgrades: Partial<Record<LevelUpgrade, number>> = {
	[LevelUpgrades.SmartFactories]: 10,
	[LevelUpgrades.SmartStorage]: 10,
}
const DesiredMaterial: Partial<Record<BoostMaterial, number>> = {
	[BoostMaterials.Hardware]: 2800,
	[BoostMaterials.Robots]: 96,
	[BoostMaterials.AiCores]: 2520,
	[BoostMaterials.RealEstate]: 146_400,
}
const DesiredOffer = 1_000_000_000_000

export class MaterialRound1Manager
	extends MaterialPhaseManager
	implements PhaseManager
{
	constructor(ns: NS, logger: Logger, company: Company) {
		super(ns, logger, company)
	}

	summarize() {
		return `INFO preparing ${MyCompany.MaterialDivision.Name} for second investment round; ${this.levelsMet}/${this.levelsDesired}; ${this.warehouseLevelsMet}/${this.warehouseLevelsDesired}; ${this.materialsMet}/${this.materialsDesired}`
	}

	async manage(): Promise<void> {
		const materialDivision = this.company.getMaterialDivision()
		if (!materialDivision) {
			this.logger.log(`ERROR no material division`)
			return
		}

		// *** TODO: Manage office size ***

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
