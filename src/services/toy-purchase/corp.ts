import { BudgetTicks, ToyBudgetProvider } from '../../models/toys'

const MaximumFundsMultiplier = 1 / 4 /* per minute */ / BudgetTicks
const MinimumFundsMultiplier = 1 / 15 /* per minute */ / BudgetTicks
const RevenueMultiplier = 0.95 /* per minute */ / BudgetTicks

export class CorpToyBudget implements ToyBudgetProvider {
	readonly name = 'corp'

	constructor(private ns: NS) {}

	budget(funds: number): number {
		// after a corporation has started alot most of hacking, CCT, and crime revenue for toy purchasing
		if (this.ns.corporation.hasCorporation()) {
			const hackingRevenue =
				(this.ns.getMoneySources().sinceInstall.hacking /
					this.ns.getPlayer().playtimeSinceLastAug) *
				60 /* s */
			const cctRevenue =
				(this.ns.getMoneySources().sinceInstall.codingcontract /
					this.ns.getPlayer().playtimeSinceLastAug) *
				60 /* s */
			const crimeRevenue =
				(this.ns.getMoneySources().sinceInstall.crime /
					this.ns.getPlayer().playtimeSinceLastAug) *
				60 /* s */
			const budget = Math.min(
				funds * MaximumFundsMultiplier,
				Math.max(
					funds * MinimumFundsMultiplier,
					(hackingRevenue + cctRevenue + crimeRevenue) * RevenueMultiplier
				)
			)
			return budget
		}
		return 0
	}
}
