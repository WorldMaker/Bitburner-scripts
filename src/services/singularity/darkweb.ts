import { Company } from '../../models/corporation'
import { ToyPurchaser } from '../../models/toys'

export class DarkwebPurchaser implements ToyPurchaser {
	constructor(private readonly ns: NS, private readonly company: Company) {}

	purchase(budget: number): number {
		if (this.company.getState() !== 'Public') {
			return budget
		}

		if (!this.ns.singularity.purchaseTor()) {
			return budget
		}

		for (const program of this.ns.singularity.getDarkwebPrograms()) {
			const cost = this.ns.singularity.getDarkwebProgramCost(program)
			if (cost <= 0) {
				// already purchased or unavailable to purchase
				continue
			}
			if (cost < budget) {
				if (this.ns.singularity.purchaseProgram(program)) {
					budget -= cost
				}
			}
		}

		return budget
	}
}
