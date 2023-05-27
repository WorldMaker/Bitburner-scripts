import { BudgetTicks, ToyBudgetProvider, ToyPurchaser } from '../../models/toys'
import { ShirtService } from '../shirt'

const SleeveBudgetThreshold = 10_000_000
const SleeveBudgetMultiplier = 1 / 4 /* per minute */ / BudgetTicks

export class SleeveUpgrader implements ToyBudgetProvider, ToyPurchaser {
	readonly name = 'sleeves'

	constructor(private ns: NS, private shirt: ShirtService) {}

	budget(funds: number): number {
		if (funds > SleeveBudgetThreshold) {
			return (
				(this.ns.getMoneySources().sinceInstall.sleeves /
					this.ns.getResetInfo().lastAugReset) *
				60 /* s */ *
				SleeveBudgetMultiplier
			)
		}
		return 0
	}

	purchase(budget: number): number {
		for (const sleeve of this.shirt.getSleeves()) {
			switch (sleeve.getState()) {
				case '✔':
				case '👩‍🎓':
				case '👷‍♀️':
				case '💻':
				case '🦝':
				case '🦹‍♀️':
					const augments = this.ns.sleeve.getSleevePurchasableAugs(sleeve.id)

					for (const { name, cost } of augments) {
						if (cost < budget) {
							if (this.ns.sleeve.purchaseSleeveAug(sleeve.id, name)) {
								budget -= cost
							}
						}
					}
					break
			}
		}
		return budget
	}
}
