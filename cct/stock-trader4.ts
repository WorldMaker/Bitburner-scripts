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
