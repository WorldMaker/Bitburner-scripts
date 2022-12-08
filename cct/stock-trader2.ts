/*
Algorithmic Stock Trader II
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

155,169,122

Determine the maximum possible profit you can earn using as many transactions as you'd like. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

If no profit can be made, then the answer should be 0
 */

const example = [155, 169, 122]

export function stockTrader2(stock: number[]) {
	let profit = 0
	let buy = 0

	for (let i = 0; i < stock.length - 1; i++) {
		if (stock[i + 1] > stock[i] && buy === 0) {
			buy = stock[i]
		}
		if (stock[i + 1] < stock[i] && buy !== 0) {
			profit += stock[i] - buy
			buy = 0
		}
	}

	if (buy !== 0) {
		profit += stock[stock.length - 1] - buy
	}

	return profit
}

export async function main(ns: NS) {
	const stock = ns.args.map((a) => Number(a))
	const profit = stockTrader2(stock)
	ns.tprint(profit)
}

const solution = stockTrader2(example)
console.log(solution)
