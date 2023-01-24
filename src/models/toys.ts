export const BudgetTicks = 6 /* 10s */

export interface ToyBudgetProvider {
	budget(funds: number): number
}

export interface ToyPurchaser {
	purchase(budget: number): number
}

export type ToyService = ToyBudgetProvider | ToyPurchaser

export function isBudgetProvider(
	service: ToyService
): service is ToyBudgetProvider {
	return 'budget' in service
}

export function isPurchaser(service: ToyService): service is ToyPurchaser {
	return 'purchase' in service
}
