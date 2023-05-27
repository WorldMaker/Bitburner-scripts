import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { Company, LevelUpgrade } from '../../models/corporation'

const { from } = IterableX

export type DesiredLevelUpgrades = Partial<Record<LevelUpgrade, number>>

export class BasePhaseManager {
	protected funds: number
	protected levelsDesired = 0
	protected levelsMet = 0

	constructor(protected readonly company: Company) {
		this.funds = company.funds
	}

	manageLevelUpgrades(desiredLevelUpgrades: DesiredLevelUpgrades) {
		const { ns, logger } = this.company.context
		for (const [upgrade, desiredLevel] of Object.entries(
			desiredLevelUpgrades
		)) {
			this.levelsDesired += desiredLevel
			const currentLevel = ns.corporation.getUpgradeLevel(upgrade)
			this.levelsMet += Math.min(desiredLevel, currentLevel)
			if (currentLevel < desiredLevel) {
				const cost = ns.corporation.getUpgradeLevelCost(upgrade)
				if (cost <= this.funds) {
					this.funds -= cost
					try {
						ns.corporation.levelUpgrade(upgrade)
						this.levelsMet++
					} catch (error) {
						logger.warn`unable to upgrade ${upgrade}: ${error}`
					}
				}
			}
		}
	}

	checkMorale(division: Division) {
		const { ns, logger } = this.company.context
		const cities = Object.values(ns.enums.CityName)
		const counts = reduce(
			from(cities).pipe(
				map((city) => ns.corporation.getOffice(division.name, city))
			),
			(acc, cur) => ({
				mor: acc.mor + cur.avgMorale,
				ene: acc.ene + cur.avgEnergy,
				total: acc.total + 1,
			}),
			{ mor: 0, ene: 0, total: 0 }
		)
		const averages = {
			mor: counts.mor / counts.total,
			ene: counts.ene / counts.total,
		}

		if (averages.mor < 97 || averages.ene < 97) {
			logger.debug`Waiting for morale; ${averages.mor.toFixed(
				3
			)}/97; ${averages.ene.toFixed(3)}/97`

			return false
		}
		return true
	}

	invest(desiredOffer: number) {
		const { ns, logger } = this.company.context
		const offer = ns.corporation.getInvestmentOffer()
		if (offer.funds + this.company.funds < desiredOffer) {
			logger.log(`rejecting offer for ${ns.formatNumber(offer.funds)}`)
			return false
		}
		if (!ns.corporation.acceptInvestmentOffer()) {
			logger.warn`unable to accept offer`
			return false
		}
		return true
	}
}
