import {
	BoostMaterial,
	BoostMaterials,
	Company,
	LevelUpgrade,
	LevelUpgrades,
	MyCompany,
} from '../../models/corporation'
import { NsLogger } from '../../logging/logger'
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
	constructor(ns: NS, logger: NsLogger, company: Company) {
		super(ns, logger, company)
	}

	summarize() {
		return `INFO preparing ${MyCompany.MaterialDivision.Name} for second investment round; ${this.levelsMet}/${this.levelsDesired}; ${this.warehouseLevelsMet}/${this.warehouseLevelsDesired}; ${this.materialsMet}/${this.materialsDesired}`
	}

	increaseHeadCount(materialDivision: Division) {
		for (const city of Object.values(this.ns.enums.CityName)) {
			const office = this.ns.corporation.getOffice(materialDivision.name, city)
			if (office.size < 9) {
				this.ns.corporation.upgradeOfficeSize(
					materialDivision.name,
					city,
					9 - office.size
				)
				while (this.ns.corporation.hireEmployee(materialDivision.name, city)) {
					// keep hiring
				}
				this.ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Operations',
					2
				)
				this.ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Engineer',
					2
				)
				this.ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Business',
					2
				)
				this.ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Management',
					2
				)
				this.ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Research & Development',
					1
				)
			}
		}
	}

	reassignResearch(materialDivision: Division) {
		for (const city of Object.values(this.ns.enums.CityName)) {
			this.ns.corporation.setAutoJobAssignment(
				materialDivision.name,
				city,
				'Research & Development',
				1
			)
			this.ns.corporation.setAutoJobAssignment(
				materialDivision.name,
				city,
				'Operations',
				3
			)
		}
	}

	async manage(): Promise<void> {
		const materialDivision = this.company.getMaterialDivision()
		if (!materialDivision) {
			this.logger.error`no material division`
			return
		}

		// Office API may not be available yet
		try {
			this.increaseHeadCount(materialDivision)
		} catch (err) {
			this.logger
				.warn`Unable to increase headcount in material division; ${err}`
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

		if (this.funds < 0) {
			this.logger.log('Waiting for profitability')
			return
		}

		if (!this.checkMorale(materialDivision)) {
			return
		}

		// In case Office API is still unavailable
		try {
			this.reassignResearch(materialDivision)
		} catch (err) {
			this.logger
				.warn`Unable to reassign research in the material division; ${err}`
		}

		this.invest(DesiredOffer)
	}
}
