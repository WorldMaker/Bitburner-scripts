import {
	BoostMaterial,
	BoostMaterials,
	Company,
	LevelUpgrade,
	LevelUpgrades,
	MyCompany,
} from '../../models/corporation'
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
	constructor(company: Company) {
		super(company)
	}

	summarize() {
		return `INFO preparing ${MyCompany.MaterialDivision.Name} for second investment round; ${this.levelsMet}/${this.levelsDesired}; ${this.warehouseLevelsMet}/${this.warehouseLevelsDesired}; ${this.materialsMet}/${this.materialsDesired}`
	}

	increaseHeadCount(materialDivision: Division) {
		const { ns } = this.company.context
		for (const city of Object.values(ns.enums.CityName)) {
			const office = ns.corporation.getOffice(materialDivision.name, city)
			if (office.size < 9) {
				ns.corporation.upgradeOfficeSize(
					materialDivision.name,
					city,
					9 - office.size
				)
				while (ns.corporation.hireEmployee(materialDivision.name, city)) {
					// keep hiring
				}
				ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Operations',
					2
				)
				ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Engineer',
					2
				)
				ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Business',
					2
				)
				ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Management',
					2
				)
				ns.corporation.setAutoJobAssignment(
					materialDivision.name,
					city,
					'Research & Development',
					1
				)
			}
		}
	}

	reassignResearch(materialDivision: Division) {
		const { ns } = this.company.context
		for (const city of Object.values(ns.enums.CityName)) {
			ns.corporation.setAutoJobAssignment(
				materialDivision.name,
				city,
				'Research & Development',
				0
			)
			ns.corporation.setAutoJobAssignment(
				materialDivision.name,
				city,
				'Operations',
				3
			)
		}
	}

	async manage(): Promise<void> {
		const { logger } = this.company.context
		const materialDivision = this.company.getMaterialDivision()
		if (!materialDivision) {
			logger.error`no material division`
			return
		}

		// Office API may not be available yet
		try {
			this.increaseHeadCount(materialDivision)
		} catch (err) {
			logger.warn`Unable to increase headcount in material division; ${err}`
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
			logger.log('Waiting for current needs to be met')
			return
		}

		if (this.funds < 0) {
			logger.log('Waiting for profitability')
			return
		}

		if (!this.checkMorale(materialDivision)) {
			return
		}

		// In case Office API is still unavailable
		try {
			this.reassignResearch(materialDivision)
		} catch (err) {
			logger.warn`Unable to reassign research in the material division; ${err}`
		}

		this.invest(DesiredOffer)
	}
}
