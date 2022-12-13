/*
Algorithmic Stock Trader I
You are attempting to solve a Coding Contract. You have 5 tries remaining, after which the contract will self-destruct.


You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

44,107,14,77,81,4,76

Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it
*/

import { maxProfit } from './stock-trader4.js'

const example = [44, 107, 14, 77, 81, 4, 76]

export function stockTrader1(stock: number[]) {
	return maxProfit(1, stock)
}

export async function main(ns: NS) {
	const stock = ns.args.map((n) => Number(n))
	const profit = stockTrader1(stock)
	ns.tprint(profit)
}

const result = stockTrader1(example)
console.log(result)
