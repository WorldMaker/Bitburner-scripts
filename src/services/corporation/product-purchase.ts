import {
	Company,
	LevelUpgrades,
	ProductDevelopment,
} from '../../models/corporation'
import { NsLogger } from '../../logging/logger'

const ToyPurchaseBudget = 1 / 10_000 /* per tick */
const AdditionalResearchBudget = 1 / 3

export class ProductPurchaseService {
	private funds = 0
	private hasEnoughAnalytics = false
	private hasEnoughBaselineResearch = false

	constructor(
		private ns: NS,
		private logger: NsLogger,
		private company: Company
	) {}

	summarize() {
		if (this.company.hasProductDivision()) {
			return `INFO purchasing upgrades`
		}
		return `INFO no product division upgrades`
	}

	purchase() {
		if (!this.company.hasProductDivision()) {
			return
		}
		// recheck funds and other things
		this.company.updateState()
		this.funds = this.company.funds
		this.hasEnoughAnalytics ||=
			this.ns.corporation.getUpgradeLevel(LevelUpgrades.WilsonAnalytics) >= 10
		const productDivision = this.company.getProductDivision()!
		const wilsonAnalyticsCost = this.ns.corporation.getUpgradeLevelCost(
			LevelUpgrades.WilsonAnalytics
		)
		const developmentOfficeUpgradeCost =
			this.ns.corporation.getOfficeSizeUpgradeCost(
				productDivision.name,
				ProductDevelopment.City,
				ProductDevelopment.OfficeSizeUpgrade
			)
		if (
			this.company.hasDevelopedProduct() &&
			wilsonAnalyticsCost < this.funds
		) {
			this.ns.corporation.levelUpgrade(LevelUpgrades.WilsonAnalytics)
			this.funds -= wilsonAnalyticsCost
		}

		if (this.hasEnoughAnalytics && developmentOfficeUpgradeCost < this.funds) {
			this.ns.corporation.upgradeOfficeSize(
				productDivision.name,
				ProductDevelopment.City,
				ProductDevelopment.OfficeSizeUpgrade
			)
			this.funds -= developmentOfficeUpgradeCost
		}

		let upgradeCost = this.ns.corporation.getHireAdVertCost(
			productDivision.name
		)

		if (this.hasEnoughAnalytics && upgradeCost < this.funds) {
			while (upgradeCost < this.funds) {
				this.ns.corporation.hireAdVert(productDivision.name)
				this.funds -= upgradeCost
				upgradeCost = this.ns.corporation.getHireAdVertCost(
					productDivision.name
				)
			}
		}

		let toyBudget = this.funds * ToyPurchaseBudget
		for (const upgrade of Object.values(LevelUpgrades)) {
			const upgradeCost = this.ns.corporation.getUpgradeLevelCost(upgrade)
			if (upgradeCost < toyBudget) {
				this.ns.corporation.levelUpgrade(upgrade)
				toyBudget -= upgradeCost
			}
		}
		const productDevelopmentOffice = this.ns.corporation.getOffice(
			productDivision.name,
			ProductDevelopment.City
		)
		for (const city of Object.values(this.ns.enums.CityName)) {
			if (city !== ProductDevelopment.City) {
				const office = this.ns.corporation.getOffice(productDivision.name, city)
				const researchSize =
					productDevelopmentOffice.size -
					ProductDevelopment.ResearchOfficeSizeOffset
				if (
					office.size < researchSize &&
					researchSize > ProductDevelopment.OfficeSizeUpgrade
				) {
					const upgradeCost = this.ns.corporation.getOfficeSizeUpgradeCost(
						productDivision.name,
						city,
						ProductDevelopment.OfficeSizeUpgrade
					)
					if (upgradeCost < toyBudget) {
						this.ns.corporation.upgradeOfficeSize(
							productDivision.name,
							city,
							ProductDevelopment.OfficeSizeUpgrade
						)
						toyBudget -= upgradeCost
					}
				}
			}
		}

		// *** Research ***
		this.hasEnoughBaselineResearch ||= this.ns.corporation.hasResearched(
			productDivision.name,
			ProductDevelopment.KeyResearch
		)
		if (this.hasEnoughBaselineResearch) {
			let researchBudget = productDivision.research * AdditionalResearchBudget
			for (const research of this.ns.corporation.getConstants().researchNames) {
				if (
					!this.ns.corporation.hasResearched(productDivision.name, research)
				) {
					let cost = Infinity

					try {
						cost = this.ns.corporation.getResearchCost(
							productDivision.name,
							research
						)
					} catch (err) {
						this.logger.warn`unable to get research cost ${research}: ${err}`
					}

					if (cost < researchBudget) {
						try {
							this.ns.corporation.research(productDivision.name, research)
							researchBudget -= cost
						} catch (err) {
							this.logger.warn`unable to research ${research}: ${err}`
						}
					}
				}
			}
		}
	}
}
