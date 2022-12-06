import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { flatMap } from '@reactivex/ix-esnext-esm/iterable/operators/flatmap'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import {
	BoostMaterial,
	BoostMaterials,
	Cities,
	Company,
	LevelUpgrade,
	LevelUpgrades,
	MyCompany,
} from '../../models/corporation'
import { Logger } from '../../models/logger'
import { PhaseManager } from './phase'

const { from } = IterableX

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

export class MaterialRound0Manager implements PhaseManager {
	private levelsDesired = 0
	private levelsMet = 0
	private warehouseLevelsDesired = 0
	private warehouseLevelsMet = 0
	private materialsDesired = 0
	private materialsMet = 0

	constructor(
		private ns: NS,
		private logger: Logger,
		private company: Company
	) {}

	summarize() {
		return `INFO preparing ${MyCompany.MaterialDivision.Name} for first investment round; ${this.levelsMet}/${this.levelsDesired}; ${this.warehouseLevelsMet}/${this.warehouseLevelsDesired}; ${this.materialsMet}/${this.materialsDesired}`
	}

	async manage(): Promise<void> {
		const materialDivision = this.company.getMaterialDivision()
		if (!materialDivision) {
			this.logger.log(`ERROR no material division`)
			return
		}

		// *** Desired level upgrades ***

		for (const [upgrade, desiredLevel] of Object.entries(
			DesiredLevelUpgrades
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

		// *** Desired Warehouse level ***

		for (const city of Cities) {
			this.warehouseLevelsDesired += DesiredWarehouseLevel
			const warehouse = this.ns.corporation.getWarehouse(
				materialDivision.name,
				city
			)
			this.warehouseLevelsMet += Math.min(
				DesiredWarehouseLevel,
				warehouse.level
			)
			if (warehouse.level < DesiredWarehouseLevel) {
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

		// *** Desired materials ***

		let buyCity: string | null = null
		let buyMaterial: string | null = null

		for (const city of Cities) {
			for (const [materialName, amountDesired] of Object.entries(
				DesiredMaterial
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
					DesiredMaterial
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

		// *** Make sure needs above are met ***

		if (
			this.levelsMet < this.levelsDesired ||
			this.warehouseLevelsMet < this.warehouseLevelsDesired ||
			this.materialsMet < this.materialsDesired
		) {
			this.logger.log('Waiting for current needs to be met')
			return
		}

		// *** Check on morale ***

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
			return
		}

		// *** Invest ***

		const offer = this.ns.corporation.getInvestmentOffer()
		if (offer.funds < DesiredOffer) {
			this.logger.log(
				`rejecting offer for ${this.ns.nFormat(offer.funds, '0.00a')}`
			)
			return
		}
		if (!this.ns.corporation.acceptInvestmentOffer()) {
			this.logger.log(`WARN unable to accept offer`)
		}
	}
}
