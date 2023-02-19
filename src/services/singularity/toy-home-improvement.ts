import { ToyPurchaser } from '../../models/toys'

export class ToyHomeImprovement implements ToyPurchaser {
	constructor(private readonly ns: NS) {}

	purchase(budget: number): number {
		const coreCost = this.ns.singularity.getUpgradeHomeCoresCost()
		if (coreCost < budget || !Number.isFinite(budget)) {
			if (this.ns.singularity.upgradeHomeCores()) {
				return budget - coreCost
			}
		}

		const ramCost = this.ns.singularity.getUpgradeHomeRamCost()
		if (ramCost < budget || !Number.isFinite(budget)) {
			if (this.ns.singularity.upgradeHomeRam()) {
				return budget - ramCost
			}
		}

		return budget
	}
}
