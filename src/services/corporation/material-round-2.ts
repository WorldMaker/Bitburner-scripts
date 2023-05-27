import {
	BoostMaterial,
	BoostMaterials,
	Company,
	MyCompany,
	ProductDevelopment,
	StartingCity,
} from '../../models/corporation'
import { MaterialPhaseManager } from './material-phase'
import { PhaseManager } from './phase'

const DesiredWarehouseLevel = 19
const DesiredMaterial: Partial<Record<BoostMaterial, number>> = {
	[BoostMaterials.Hardware]: 9300,
	[BoostMaterials.Robots]: 726,
	[BoostMaterials.AiCores]: 6270,
	[BoostMaterials.RealEstate]: 230_400,
}

export class MaterialRound2Manager
	extends MaterialPhaseManager
	implements PhaseManager
{
	constructor(company: Company) {
		super(company)
	}

	summarize() {
		return `INFO preparing ${MyCompany.MaterialDivision.Name} for third investment round; ${this.warehouseLevelsMet}/${this.warehouseLevelsDesired}; ${this.materialsMet}/${this.materialsDesired}`
	}

	async manage(): Promise<void> {
		const { ns, logger } = this.company.context
		const materialDivision = this.company.getMaterialDivision()
		if (!materialDivision) {
			logger.error`no material division`
			return
		}

		this.manageWarehouseLevel(materialDivision, DesiredWarehouseLevel)
		await this.manageMaterials(materialDivision, DesiredMaterial)

		// *** Make sure needs above are met ***

		if (
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

		// *** Kick off the Product Division ***

		ns.corporation.expandIndustry(
			MyCompany.ProductDivision.Type,
			MyCompany.ProductDivision.Name
		)
		for (const city of Object.values(ns.enums.CityName)) {
			if (city !== StartingCity) {
				ns.corporation.expandCity(MyCompany.ProductDivision.Name, city)
			}
			ns.corporation.purchaseWarehouse(MyCompany.ProductDivision.Name, city)
			ns.corporation.setSmartSupply(MyCompany.ProductDivision.Name, city, true)
			if (city === ProductDevelopment.City) {
				ns.corporation.upgradeOfficeSize(
					MyCompany.ProductDivision.Name,
					city,
					27
				)
			} else {
				ns.corporation.upgradeOfficeSize(
					MyCompany.ProductDivision.Name,
					city,
					6
				)
			}
		}
	}
}
