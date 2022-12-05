import {
	AnalyticsLevelUpgrade,
	Company,
	LevelUpgrades,
	ProductDevelopment,
} from '../../models/corporation'

const ToyPurchaseBudget = 1 / 10_000_000 /* per tick */

export class ProductPurchaseService {
	constructor(private ns: NS, private company: Company) {}

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
		const productDivision = this.company.getProductDivision()!
		if (
			this.company.hasDevelopedProduct() &&
			this.ns.corporation.getUpgradeLevelCost(AnalyticsLevelUpgrade) <
				this.company.funds
		) {
			this.ns.corporation.levelUpgrade(AnalyticsLevelUpgrade)
		} else if (
			this.ns.corporation.getOfficeSizeUpgradeCost(
				productDivision.name,
				ProductDevelopment.City,
				ProductDevelopment.OfficeSizeUpgrade
			)
		) {
			this.ns.corporation.upgradeOfficeSize(
				productDivision.name,
				ProductDevelopment.City,
				ProductDevelopment.OfficeSizeUpgrade
			)
		} else if (this.ns.corporation.getHireAdVertCost(productDivision.name)) {
			this.ns.corporation.hireAdVert(productDivision.name)
		}

		let toyBudget = this.company.funds * ToyPurchaseBudget
		for (const upgrade of LevelUpgrades) {
			const upgradeCost = this.ns.corporation.getUpgradeLevelCost(upgrade)
			if (upgradeCost < toyBudget) {
				this.ns.corporation.levelUpgrade(upgrade)
				toyBudget -= upgradeCost
			}
		}
	}
}
