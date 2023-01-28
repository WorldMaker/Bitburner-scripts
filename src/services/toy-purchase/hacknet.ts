import { BudgetTicks, ToyBudgetProvider, ToyPurchaser } from '../../models/toys'

const HacknetBudgetThreshold = 10_000_000
const HacknetBudgetMultiplier = 1 / 3 /* per minute */ / BudgetTicks

export class HacknetToyService implements ToyBudgetProvider, ToyPurchaser {
	constructor(private ns: NS) {}

	budget(funds: number): number {
		if (funds > HacknetBudgetThreshold) {
			let hacknetProduction = 0
			for (let i = 0; i < this.ns.hacknet.numNodes(); i++) {
				hacknetProduction += this.ns.hacknet.getNodeStats(i).production
			}
			const hacknetProductionPerMinute = hacknetProduction * 60 /* s */
			const hacknetBudgetPerTick =
				hacknetProductionPerMinute * HacknetBudgetMultiplier
			if (hacknetBudgetPerTick < funds) {
				return hacknetBudgetPerTick
			}
		}
		return 0
	}

	purchase(budget: number): number {
		// *** Attempt to buy hackNet nodes ***
		const hacknetNodeCount = this.ns.hacknet.numNodes()

		{
			const cost = this.ns.hacknet.getPurchaseNodeCost()
			if (budget > cost && hacknetNodeCount < this.ns.hacknet.maxNumNodes()) {
				if (this.ns.hacknet.purchaseNode() > 0) {
					budget -= cost
				}
			}
		}

		// *** Attempt to level hackNet nodes ***
		for (let i = 0; i < hacknetNodeCount; i++) {
			const cost = this.ns.hacknet.getLevelUpgradeCost(i, 1)
			if (budget > cost) {
				if (this.ns.hacknet.upgradeLevel(i, 1)) {
					budget -= cost
				}
			}
		}

		// *** Attempt to increase hackNet RAM ***
		for (let i = 0; i < hacknetNodeCount; i++) {
			const cost = this.ns.hacknet.getRamUpgradeCost(i, 1)
			if (budget > cost) {
				if (this.ns.hacknet.upgradeRam(i, 1)) {
					budget -= cost
				}
			}
		}

		// *** Attempt to increase hackNet Cores ***
		for (let i = 0; i < hacknetNodeCount; i++) {
			const cost = this.ns.hacknet.getCoreUpgradeCost(i, 1)
			if (budget > cost) {
				if (this.ns.hacknet.upgradeCore(i, 1)) {
					budget -= cost
				}
			}
		}

		return budget
	}
}
