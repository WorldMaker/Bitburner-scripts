import { BudgetTicks, ToyBudgetProvider } from '../../models/toys'

const ToyBudgetMultiplier = 1 / 10_000_000 /* per minute */ / BudgetTicks

export class SimpleBudgetProvider implements ToyBudgetProvider {
	budget(funds: number): number {
		return funds * ToyBudgetMultiplier
	}
}
