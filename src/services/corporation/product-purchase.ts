import {
	Company,
	LevelUpgrades,
	ProductDevelopment,
} from '../../models/corporation'

const ToyPurchaseBudget = 1 / 10_000 /* per tick */
const ToyPurchaseProfitBudget = 5 /* per tick => * 10 seconds per tick so 1/2 of profit per second */
const AdditionalResearchBudget = 1 / 3

export class ProductPurchaseService {
	private funds = 0
	private startingFunds = 0
	private toyBudget = 0
	private hasEnoughAnalytics = false
	private hasEnoughBaselineResearch = false
	private canUseRevenueBudget = false

	constructor(private readonly company: Company) {}

	summarize() {
		const { ns, logger } = this.company.context
		if (this.company.hasProductDivision()) {
			logger.info`purchasing upgrades; ${ns.formatNumber(
				this.startingFunds - this.funds
			)} / ${ns.formatNumber(this.toyBudget)}`
		}
	}

	manage() {
		this.purchase()
	}

	purchase() {
		if (!this.company.hasProductDivision()) {
			return
		}
		const { ns, logger } = this.company.context
		// recheck funds and other things
		this.company.updateState()
		this.startingFunds = this.funds = this.company.funds
		this.hasEnoughAnalytics ||=
			ns.corporation.getUpgradeLevel(LevelUpgrades.WilsonAnalytics) >= 10
		const productDivision = this.company.getProductDivision()!
		const wilsonAnalyticsCost = ns.corporation.getUpgradeLevelCost(
			LevelUpgrades.WilsonAnalytics
		)
		const developmentOfficeUpgradeCost =
			ns.corporation.getOfficeSizeUpgradeCost(
				productDivision.name,
				ProductDevelopment.City,
				ProductDevelopment.OfficeSizeUpgrade
			)
		if (
			this.company.hasDevelopedProduct() &&
			wilsonAnalyticsCost < this.funds
		) {
			ns.corporation.levelUpgrade(LevelUpgrades.WilsonAnalytics)
			this.funds -= wilsonAnalyticsCost
		}

		if (this.hasEnoughAnalytics && developmentOfficeUpgradeCost < this.funds) {
			ns.corporation.upgradeOfficeSize(
				productDivision.name,
				ProductDevelopment.City,
				ProductDevelopment.OfficeSizeUpgrade
			)
			this.funds -= developmentOfficeUpgradeCost
		}

		let upgradeCost = ns.corporation.getHireAdVertCost(productDivision.name)

		if (this.hasEnoughAnalytics && upgradeCost < this.funds) {
			while (upgradeCost < this.funds) {
				ns.corporation.hireAdVert(productDivision.name)
				this.funds -= upgradeCost
				upgradeCost = ns.corporation.getHireAdVertCost(productDivision.name)
			}
		}

		let toyBudget = this.funds * ToyPurchaseBudget
		this.toyBudget = toyBudget

		this.canUseRevenueBudget ||= (() => {
			switch (this.company.getState()) {
				// Beginning at Product3Round there are no longer phase-based purchasing goals
				case 'Product3Round':
				case 'Product4Round':
				case 'Public':
					return true
				default:
					return false
			}
		})()

		if (this.canUseRevenueBudget) {
			const revenueBudget =
				(this.company.corporation!.revenue -
					this.company.corporation!.expenses) *
				ToyPurchaseProfitBudget
			if (revenueBudget < this.funds - toyBudget) {
				toyBudget += revenueBudget
				this.toyBudget = toyBudget
			}
		}

		// "borrow" the toy budget from funds
		this.funds -= this.toyBudget

		for (const upgrade of Object.values(LevelUpgrades)) {
			const upgradeCost = ns.corporation.getUpgradeLevelCost(upgrade)
			if (upgradeCost < toyBudget) {
				ns.corporation.levelUpgrade(upgrade)
				toyBudget -= upgradeCost
			}
		}
		for (const unlock of ns.corporation.getConstants().unlockNames) {
			if (ns.corporation.hasUnlockUpgrade(unlock)) {
				continue
			}
			const unlockCost = ns.corporation.getUnlockUpgradeCost(unlock)
			if (unlockCost < toyBudget) {
				try {
					ns.corporation.unlockUpgrade(unlock)
					toyBudget -= unlockCost
				} catch (err) {
					logger.warn`unable to unlock ${this.company.name} feature ${unlock}; ${err}`
				}
			}
		}
		const productDevelopmentOffice = ns.corporation.getOffice(
			productDivision.name,
			ProductDevelopment.City
		)
		for (const city of Object.values(ns.enums.CityName)) {
			if (city !== ProductDevelopment.City) {
				const office = ns.corporation.getOffice(productDivision.name, city)
				const researchSize =
					productDevelopmentOffice.size -
					ProductDevelopment.ResearchOfficeSizeOffset
				if (
					office.size < researchSize &&
					researchSize > ProductDevelopment.OfficeSizeUpgrade
				) {
					const upgradeCost = ns.corporation.getOfficeSizeUpgradeCost(
						productDivision.name,
						city,
						ProductDevelopment.OfficeSizeUpgrade
					)
					if (upgradeCost < toyBudget) {
						ns.corporation.upgradeOfficeSize(
							productDivision.name,
							city,
							ProductDevelopment.OfficeSizeUpgrade
						)
						toyBudget -= upgradeCost
					}
				}
			}
		}

		// return unspent funds
		this.funds += toyBudget

		// *** Research ***
		this.hasEnoughBaselineResearch ||= ns.corporation.hasResearched(
			productDivision.name,
			ProductDevelopment.KeyResearch
		)
		if (this.hasEnoughBaselineResearch) {
			let researchBudget = productDivision.research * AdditionalResearchBudget
			for (const research of ns.corporation.getConstants().researchNames) {
				if (!ns.corporation.hasResearched(productDivision.name, research)) {
					let cost = Infinity

					try {
						cost = ns.corporation.getResearchCost(
							productDivision.name,
							research
						)
					} catch (err) {
						logger.warn`unable to get research cost ${research}: ${err}`
					}

					if (cost < researchBudget) {
						try {
							ns.corporation.research(productDivision.name, research)
							researchBudget -= cost
						} catch (err) {
							logger.warn`unable to research ${research}: ${err}`
						}
					}
				}
			}
		}
	}
}
