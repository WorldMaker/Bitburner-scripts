import {
	Cities,
	Company,
	LevelUpgrades,
	ProductDevelopment,
} from '../../models/corporation'

const ToyPurchaseBudget = 1 / 10_000_000 /* per tick */

export class ProductPurchaseService {
	private funds = 0
	private hasEnoughAnalytics = false

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
		for (const city of Cities) {
			if (city !== ProductDevelopment.City) {
				const office = this.ns.corporation.getOffice(productDivision.name, city)
				const researchSize =
					productDevelopmentOffice.size -
					ProductDevelopment.ResearchOfficeSizeOffset
				if (office.size < researchSize) {
					const growSize = researchSize - office.size
					const upgradeCost = this.ns.corporation.getOfficeSizeUpgradeCost(
						productDivision.name,
						city,
						growSize
					)
					if (upgradeCost < toyBudget) {
						this.ns.corporation.upgradeOfficeSize(
							productDivision.name,
							city,
							growSize
						)
						toyBudget -= upgradeCost
					}
				}
			}
		}
	}
}
