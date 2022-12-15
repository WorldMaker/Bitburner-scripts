import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { flatMap } from '@reactivex/ix-esnext-esm/iterable/operators/flatmap'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { reduce } from '@reactivex/ix-esnext-esm/iterable/reduce'
import { Cities, Company, LevelUpgrade } from '../../models/corporation'
import { NsLogger } from '../../logging/logger'

const { from } = IterableX

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
			averages.ene < 99.998
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
			this.logger.warn`unable to accept offer`
			return false
		}
		return true
	}
}
