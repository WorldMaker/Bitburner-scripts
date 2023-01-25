import { ToyPurchaser } from '../../models/toys'
import { ShirtService } from '../shirt'

export class SleeveUpgrader implements ToyPurchaser {
	constructor(private ns: NS, private shirt: ShirtService) {}

	purchase(budget: number): number {
		for (const sleeve of this.shirt.getSleeves()) {
			const augments = this.ns.sleeve.getSleevePurchasableAugs(sleeve.id)

			for (const { name, cost } of augments) {
				if (cost < budget) {
					if (this.ns.sleeve.purchaseSleeveAug(sleeve.id, name)) {
						budget -= cost
					}
				}
			}
		}
		return budget
	}
}
