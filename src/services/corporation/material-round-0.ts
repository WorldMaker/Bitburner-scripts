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
const DesiredOffer = 200_000_000_000

const SellAll = 'MAX'
const SellAtMarketPrice = 'MP'

export class MaterialRound0Manager
	extends MaterialPhaseManager
	implements PhaseManager
{
	private readonly citiesDesired: CityName[]
	private citiesMet = 0

	constructor(ns: NS, logger: NsLogger, company: Company) {
		super(ns, logger, company)

		this.citiesDesired = Object.values(ns.enums.CityName)
	}

	summarize() {
		return `INFO preparing ${MyCompany.MaterialDivision.Name} for first investment round; ${this.citiesMet}/${this.citiesDesired.length}; ${this.levelsMet}/${this.levelsDesired}; ${this.warehouseLevelsMet}/${this.warehouseLevelsDesired}; ${this.materialsMet}/${this.materialsDesired}`
	}

	assignEmployees(materialDivision: Division, city: CityName) {
		const office = this.ns.corporation.getOffice(materialDivision.name, city)
		if (office.employeeJobs.Unassigned > 0) {
			while (this.ns.corporation.hireEmployee(materialDivision.name, city)) {
				// keep hiring
			}
			this.ns.corporation.setAutoJobAssignment(
				materialDivision.name,
				city,
				'Operations',
				1
			)
			this.ns.corporation.setAutoJobAssignment(
				materialDivision.name,
				city,
				'Engineer',
				1
			)
			this.ns.corporation.setAutoJobAssignment(
				materialDivision.name,
				city,
				'Business',
				1
			)
		}
	}

	expandAllCities(materialDivision: Division) {
		for (const city of this.citiesDesired) {
			if (materialDivision.cities.includes(city)) {
				// *** Ensure has a warehouse ***
				try {
					this.ns.corporation.getWarehouse(materialDivision.name, city)
					this.citiesMet++
				} catch {
					const cost = this.ns.corporation.getConstants().warehouseInitialCost
					if (this.funds >= cost) {
						this.ns.corporation.purchaseWarehouse(materialDivision.name, city)
						this.ns.corporation.setSmartSupply(
							materialDivision.name,
							city,
							true
						)
						this.funds -= cost
						this.citiesMet++
					}
				}
				continue
			}

			const cost = this.ns.corporation.getConstants().officeInitialCost
			if (this.funds >= cost) {
				this.ns.corporation.expandCity(materialDivision.name, city)
				for (const material of MyCompany.MaterialDivision.SellMaterials) {
					this.ns.corporation.sellMaterial(
						MyCompany.MaterialDivision.Name,
						city,
						material,
						SellAll,
						SellAtMarketPrice
					)
				}
				this.funds -= cost
				// Office API may not be available yet
				try {
					this.assignEmployees(materialDivision, city)
				} catch (err) {
					this.logger
						.warn`Unable to assign employees in material division; ${err}`
				}
				const warehouseCost =
					this.ns.corporation.getConstants().warehouseInitialCost
				if (this.funds >= warehouseCost) {
					this.ns.corporation.purchaseWarehouse(materialDivision.name, city)
					this.ns.corporation.setSmartSupply(materialDivision.name, city, true)
					this.funds -= warehouseCost
					this.citiesMet++
				}
			}
		}
	}

	async manage(): Promise<void> {
		const materialDivision = this.company.getMaterialDivision()
		if (!materialDivision) {
			this.logger.error`no material division`
			return
		}

		this.expandAllCities(materialDivision)
		this.manageLevelUpgrades(DesiredLevelUpgrades)
		this.manageWarehouseLevel(materialDivision, DesiredWarehouseLevel)
		await this.manageMaterials(materialDivision, DesiredMaterial)

		// *** Make sure needs above are met ***

		if (
			this.citiesMet < this.citiesDesired.length ||
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

		this.invest(DesiredOffer)
	}
}
