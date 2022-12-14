/*
Algorithmic Stock Trader IV
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following array with two elements:

[10, [198,123,30,66,22,35,57,132,156,46,9,141,92,19,60,169,123,120,169,194,154,1]]

The first element is an integer k. The second element is an array of stock prices (which are numbers) where the i-th element represents the stock price on day i.

Determine the maximum possible profit you can earn using at most k transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you can buy it again.

If no profit can be made, then the answer should be 0.
*/

export type StockInput = [number, number[]]

const example = [
	10,
	[
		198, 123, 30, 66, 22, 35, 57, 132, 156, 46, 9, 141, 92, 19, 60, 169, 123,
		120, 169, 194, 154, 1,
	] as number[],
] as const

export function maxProfit(maxTrades: number, stock: number[]) {
	const profitMatrix = Array.from(new Array(maxTrades), () =>
		new Array<number>(stock.length).fill(0)
	)
	console.log(profitMatrix)

	for (let trade = 0; trade < maxTrades; trade++) {
		// transaction left: buy
		for (let buy = 0; buy < stock.length; buy++) {
			// transaction right: sell
			for (let sell = buy; sell < stock.length; sell++) {
				if (trade > 0 && buy > 0 && sell > 0) {
					profitMatrix[trade][sell] = Math.max(
						profitMatrix[trade][sell],
						profitMatrix[trade - 1][sell],
						profitMatrix[trade][sell - 1],
						profitMatrix[trade - 1][buy - 1] + stock[sell] - stock[buy]
					)
				} else if (trade > 0 && buy > 0) {
					profitMatrix[trade][sell] = Math.max(
						profitMatrix[trade][sell],
						profitMatrix[trade - 1][sell],
						profitMatrix[trade - 1][buy - 1] + stock[sell] - stock[buy]
					)
				} else if (trade > 0 && sell > 0) {
					profitMatrix[trade][sell] = Math.max(
						profitMatrix[trade][sell],
						profitMatrix[trade - 1][sell],
						profitMatrix[trade][sell - 1],
						stock[sell] - stock[buy]
					)
				} else if (buy > 0 && sell > 0) {
					profitMatrix[trade][sell] = Math.max(
						profitMatrix[trade][sell],
						profitMatrix[trade][sell - 1],
						stock[sell] - stock[buy]
					)
				} else {
					profitMatrix[trade][sell] = Math.max(
						profitMatrix[trade][sell],
						stock[sell] - stock[buy]
					)
				}
			}
		}
	}

	console.log(profitMatrix)

	return profitMatrix[maxTrades - 1][stock.length - 1]
}

export function stockTrader4([maxTrades, stock]: StockInput) {
	return maxProfit(maxTrades, stock)
}

export async function main(ns: NS) {
	const [maxTrades, ...stock] = ns.args.map((a) => Number(a))
	const profit = maxProfit(maxTrades, stock)
	ns.tprint(profit)
}

const profit = maxProfit(example[0], example[1])
console.log(profit)
