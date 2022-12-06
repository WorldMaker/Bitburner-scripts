import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { flatMap } from '@reactivex/ix-esnext-esm/iterable/operators/flatmap'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import {
	BoostMaterial,
	Cities,
	Company,
	LevelUpgrade,
	MyCompany,
} from '../../models/corporation'
import { Logger } from '../../models/logger'

const { from } = IterableX

export type DesiredLevelUpgrades = Partial<Record<LevelUpgrade, number>>
export type DesiredMaterial = Partial<Record<BoostMaterial, number>>

export class MaterialPhaseManager {
	protected levelsDesired = 0
	protected levelsMet = 0
	protected warehouseLevelsDesired = 0
	protected warehouseLevelsMet = 0
	protected materialsDesired = 0
	protected materialsMet = 0

	constructor(
		protected ns: NS,
		protected logger: Logger,
		protected company: Company
	) {}

	manageLevelUpgrades(desiredLevelUpgrades: DesiredLevelUpgrades) {
		for (const [upgrade, desiredLevel] of Object.entries(
			desiredLevelUpgrades
		)) {
			this.levelsDesired += desiredLevel
			const currentLevel = this.ns.corporation.getUpgradeLevel(upgrade)
			this.levelsMet += Math.min(desiredLevel, currentLevel)
			if (currentLevel < desiredLevel) {
				try {
					this.ns.corporation.levelUpgrade(upgrade)
					this.levelsMet++
				} catch (error) {
					this.logger.log(`WARN unable to upgrade ${upgrade}: ${error}`)
				}
			}
		}
	}

	manageWarehouseLevel(
		materialDivision: Division,
		desiredWarehouseLevel: number
	) {
		for (const city of Cities) {
			this.warehouseLevelsDesired += desiredWarehouseLevel
			const warehouse = this.ns.corporation.getWarehouse(
				materialDivision.name,
				city
			)
			this.warehouseLevelsMet += Math.min(
				desiredWarehouseLevel,
				warehouse.level
			)
			if (warehouse.level < desiredWarehouseLevel) {
				try {
					this.ns.corporation.upgradeWarehouse(materialDivision.name, city)
					this.warehouseLevelsMet++
				} catch (error) {
					this.logger.log(
						`WARN unable to upgrade warehouse in ${city}: ${error}`
					)
				}
			}
		}
	}

	async manageMaterials(
		materialDivision: Division,
		desiredMaterial: DesiredMaterial
	) {
		let buyCity: string | null = null
		let buyMaterial: string | null = null

		for (const city of Cities) {
			for (const [materialName, amountDesired] of Object.entries(
				desiredMaterial
			)) {
				this.materialsDesired += amountDesired
				const material = this.ns.corporation.getMaterial(
					materialDivision.name,
					city,
					materialName
				)
				if (material.qty < amountDesired) {
					const toBuy = (amountDesired - material.qty) / 10 /* ticks/second */
					this.ns.corporation.buyMaterial(
						materialDivision.name,
						city,
						materialName,
						toBuy
					)
					buyCity = city
					buyMaterial = materialName
				}
			}
		}

		if (buyCity && buyMaterial) {
			// *** Wait for purchase ***

			const benchmark = this.ns.corporation.getMaterial(
				materialDivision.name,
				buyCity,
				buyMaterial
			).qty
			while (
				benchmark ===
				this.ns.corporation.getMaterial(
					materialDivision.name,
					buyCity,
					buyMaterial
				).qty
			) {
				await this.ns.sleep(20 /* ms */)
			}

			// *** Clear purchases; count how much was met ***

			for (const city of Cities) {
				for (const [materialName, amountDesired] of Object.entries(
					desiredMaterial
				)) {
					// clear purchase
					this.ns.corporation.buyMaterial(
						materialDivision.name,
						city,
						materialName,
						0
					)
					const materialAmount = this.ns.corporation.getMaterial(
						materialDivision.name,
						city,
						materialName
					).qty
					this.materialsMet += Math.min(materialAmount, amountDesired)
				}
			}
		}
	}

	checkMorale(materialDivision: Division) {
		const counts = reduce(
			from(Cities).pipe(
				flatMap((city) =>
					from(
						this.ns.corporation.getOffice(materialDivision.name, city).employees
					).pipe(
						map((name) =>
							this.ns.corporation.getEmployee(materialDivision.name, city, name)
						)
					)
				)
			),
			(acc, cur) => ({
				mor: acc.mor + cur.mor,
				hap: acc.hap + cur.hap,
				ene: acc.ene + cur.ene,
				total: acc.total + 1,
			}),
			{ mor: 0, hap: 0, ene: 0, total: 0 }
		)
		const averages = {
			mor: counts.mor / counts.total,
			hap: counts.hap / counts.total,
			ene: counts.ene / counts.total,
		}

		if (
			averages.mor < 99.99999 ||
			averages.hap < 99.998 ||
			averages.ene >= 99.998
		) {
			this.logger.log(
				`Waiting for morale; ${averages.mor.toFixed(
					3
				)}/100; ${averages.hap.toFixed(3)}/99.998; ${averages.ene.toFixed(
					3
				)}/99.998`
			)
			return false
		}
		return true
	}

	invest(desiredOffer: number) {
		const offer = this.ns.corporation.getInvestmentOffer()
		if (offer.funds < desiredOffer) {
			this.logger.log(
				`rejecting offer for ${this.ns.nFormat(offer.funds, '0.00a')}`
			)
			return false
		}
		if (!this.ns.corporation.acceptInvestmentOffer()) {
			this.logger.log(`WARN unable to accept offer`)
			return false
		}
		return true
	}
}
