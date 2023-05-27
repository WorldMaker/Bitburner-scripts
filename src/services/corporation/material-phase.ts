import { BoostMaterial, Company } from '../../models/corporation'
import { BasePhaseManager } from './base-phase'

export type DesiredMaterial = Partial<Record<BoostMaterial, number>>

export class MaterialPhaseManager extends BasePhaseManager {
	protected warehouseLevelsDesired = 0
	protected warehouseLevelsMet = 0
	protected materialsDesired = 0
	protected materialsMet = 0

	constructor(company: Company) {
		super(company)
	}

	manageWarehouseLevel(
		materialDivision: Division,
		desiredWarehouseLevel: number
	) {
		const { ns, logger } = this.company.context
		for (const city of materialDivision.cities) {
			this.warehouseLevelsDesired += desiredWarehouseLevel
			let warehouse: Warehouse | null = null
			try {
				warehouse = ns.corporation.getWarehouse(materialDivision.name, city)
			} catch {
				continue
			}
			this.warehouseLevelsMet += Math.min(
				desiredWarehouseLevel,
				warehouse.level
			)
			if (warehouse.level < desiredWarehouseLevel) {
				const cost = ns.corporation.getUpgradeWarehouseCost(
					materialDivision.name,
					city
				)
				if (cost <= this.funds) {
					try {
						ns.corporation.upgradeWarehouse(materialDivision.name, city)
						this.funds -= cost
						this.warehouseLevelsMet++
					} catch (error) {
						logger.warn`unable to upgrade warehouse in ${city}: ${error}`
					}
				}
			}
		}
	}

	async manageMaterials(
		materialDivision: Division,
		desiredMaterial: DesiredMaterial
	) {
		const { ns } = this.company.context
		if (this.warehouseLevelsMet < this.warehouseLevelsDesired) {
			for (const amountDesired of Object.values(desiredMaterial)) {
				this.materialsDesired += amountDesired * materialDivision.cities.length
			}
			return
		}
		let buyCity: CityName | null = null
		let buyMaterial: string | null = null

		for (const city of materialDivision.cities) {
			for (const [materialName, amountDesired] of Object.entries(
				desiredMaterial
			)) {
				this.materialsDesired += amountDesired
				const material = ns.corporation.getMaterial(
					materialDivision.name,
					city,
					materialName
				)
				if (material.stored < amountDesired) {
					const toBuy = amountDesired - material.stored
					const cost = toBuy * material.marketPrice
					if (cost <= this.funds) {
						// we want to buy as much as possible (ideally the entire amount) in a single tick
						const toBuyPerSecond = toBuy /* per tick */ / 10 /* seconds/tick */
						ns.corporation.buyMaterial(
							materialDivision.name,
							city,
							materialName,
							toBuyPerSecond
						)
						this.funds -= cost
						buyCity = city
						buyMaterial = materialName
					}
				}
			}
		}

		if (buyCity && buyMaterial) {
			// *** Wait for purchase ***

			const benchmark = ns.corporation.getMaterial(
				materialDivision.name,
				buyCity,
				buyMaterial
			).stored
			while (
				benchmark ===
				ns.corporation.getMaterial(materialDivision.name, buyCity, buyMaterial)
					.stored
			) {
				await ns.sleep(20 /* ms */)
			}
		}

		// *** Clear purchases; count how much was met ***

		for (const city of materialDivision.cities) {
			for (const [materialName, amountDesired] of Object.entries(
				desiredMaterial
			)) {
				// clear purchase
				ns.corporation.buyMaterial(materialDivision.name, city, materialName, 0)
				const materialAmount = ns.corporation.getMaterial(
					materialDivision.name,
					city,
					materialName
				).stored
				this.materialsMet += Math.min(materialAmount, amountDesired)
			}
		}
	}
}
