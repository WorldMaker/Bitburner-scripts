/*
Algorithmic Stock Trader III
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

120,93,169,131,41,150,104,170,189,196,128,27,7,26,159,194,25,172,198,150,104,187,143,46,106,189,112,166,136,47,95,55,21,121,71,6,115,60,68,120,151,132,36,11,194,162,145

Determine the maximum possible profit you can earn using at most two transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

If no profit can be made, then the answer should be 0
*/

import { maxProfit } from './stock-trader4.js'

const example = [
	120, 93, 169, 131, 41, 150, 104, 170, 189, 196, 128, 27, 7, 26, 159, 194, 25,
	172, 198, 150, 104, 187, 143, 46, 106, 189, 112, 166, 136, 47, 95, 55, 21,
	121, 71, 6, 115, 60, 68, 120, 151, 132, 36, 11, 194, 162, 145,
]
// const exampleExpected = 379

export function stocktrader3(stock: number[]) {
	return maxProfit(2, stock)
}

export async function main(ns: NS) {
	const stock = ns.args.map((n) => Number(n))
	const profit = stocktrader3(stock)
	ns.tprint(profit)
}

const profit = stocktrader3(example)
console.log(profit)
