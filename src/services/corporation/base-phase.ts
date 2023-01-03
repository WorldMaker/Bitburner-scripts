import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { Company, LevelUpgrade } from '../../models/corporation'
import { NsLogger } from '../../logging/logger'

const { from } = IterableX

const PartyBudget = 500_000 /* $/employee */

export type DesiredLevelUpgrades = Partial<Record<LevelUpgrade, number>>

export class BasePhaseManager {
	protected funds: number
	protected levelsDesired = 0
	protected levelsMet = 0

	constructor(
		protected ns: NS,
		protected logger: NsLogger,
		protected company: Company
	) {
		this.funds = company.funds
	}

	manageLevelUpgrades(desiredLevelUpgrades: DesiredLevelUpgrades) {
		for (const [upgrade, desiredLevel] of Object.entries(
			desiredLevelUpgrades
		)) {
			this.levelsDesired += desiredLevel
			const currentLevel = this.ns.corporation.getUpgradeLevel(upgrade)
			this.levelsMet += Math.min(desiredLevel, currentLevel)
			if (currentLevel < desiredLevel) {
				const cost = this.ns.corporation.getUpgradeLevelCost(upgrade)
				if (cost <= this.funds) {
					this.funds -= cost
					try {
						this.ns.corporation.levelUpgrade(upgrade)
						this.levelsMet++
					} catch (error) {
						this.logger.warn`unable to upgrade ${upgrade}: ${error}`
					}
				}
			}
		}
	}

	checkMorale(division: Division) {
		const cities = Object.values(this.ns.enums.CityName)
		const counts = reduce(
			from(cities).pipe(
				map((city) => this.ns.corporation.getOffice(division.name, city))
			),
			(acc, cur) => ({
				mor: acc.mor + cur.avgMor,
				hap: acc.hap + cur.avgHap,
				ene: acc.ene + cur.avgEne,
				total: acc.total + 1,
			}),
			{ mor: 0, hap: 0, ene: 0, total: 0 }
		)
		const averages = {
			mor: counts.mor / counts.total,
			hap: counts.hap / counts.total,
			ene: counts.ene / counts.total,
		}

		if (averages.mor < 97 || averages.hap < 97 || averages.ene < 97) {
			for (const city of Object.values(this.ns.enums.CityName)) {
				const office = this.ns.corporation.getOffice(division.name, city)
				if (office.avgMor < 95 || office.avgHap < 95) {
					this.logger.debug`throwing party for ${division.name} ${city}`
					try {
						this.ns.corporation.throwParty(division.name, city, PartyBudget)
					} catch (err) {
						this.logger.warn`unable to throw party: ${err}`
					}
				}
				if (office.avgEne < 95) {
					this.logger.debug`buying coffee for ${division.name} ${city}`
					try {
						this.ns.corporation.buyCoffee(division.name, city)
					} catch (err) {
						this.logger.warn`unable to buy coffee: ${err}`
					}
				}
			}

			this.logger.debug`Waiting for morale; ${averages.mor.toFixed(
				3
			)}/97; ${averages.hap.toFixed(3)}/97; ${averages.ene.toFixed(3)}/97`

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
			this.logger.warn`unable to accept offer`
			return false
		}
		return true
	}
}
