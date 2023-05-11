import { NsContext } from '../../models/context'
import { ToyPurchaser } from '../../models/toys'

export class DarkwebPurchaser implements ToyPurchaser {
	constructor(private readonly context: NsContext) {}

	purchase(budget: number): number {
		const { ns, hasPublicCompany } = this.context
		if (!hasPublicCompany) {
			return budget
		}

		if (!ns.singularity.purchaseTor()) {
			return budget
		}

		for (const program of ns.singularity.getDarkwebPrograms()) {
			const cost = ns.singularity.getDarkwebProgramCost(program)
			if (cost <= 0) {
				// already purchased or unavailable to purchase
				continue
			}
			if (cost < budget) {
				if (ns.singularity.purchaseProgram(program)) {
					budget -= cost
				}
			}
		}

		return budget
	}
}
