import { ToyPurchaser } from '../../models/toys'

export class HacknetCachePurchaser implements ToyPurchaser {
	constructor(private readonly ns: NS) {}

	purchase(budget: number): number {
		const hacknetNodeCount = this.ns.hacknet.numNodes()

		for (let i = 0; i < hacknetNodeCount; i++) {
			const cost = this.ns.hacknet.getCacheUpgradeCost(i, 1)
			if (budget > cost) {
				if (this.ns.hacknet.upgradeCache(i, 1)) {
					budget -= cost
				}
			}
		}

		return budget
	}
}
