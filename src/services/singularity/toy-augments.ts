import { ToyPurchaser } from '../../models/toys'
import { AugmentPrioritizer, NFG } from './augments'

export class AugmentToyPurchaser implements ToyPurchaser {
	constructor(
		private readonly ns: NS,
		private readonly priorities: AugmentPrioritizer
	) {}

	purchase(budget: number): number {
		for (const augment of this.priorities.getPriorities()) {
			if (augment.name.startsWith(NFG)) {
				continue
			}
			if (augment.cost > budget && !Number.isNaN(budget)) {
				break
			}
			const factionRep = this.ns.singularity.getFactionRep(augment.faction)
			if (factionRep < augment.rep) {
				break
			}
			if (
				this.ns.singularity.purchaseAugmentation(augment.faction, augment.name)
			) {
				budget -= augment.cost
			}
		}
		return budget
	}
}
