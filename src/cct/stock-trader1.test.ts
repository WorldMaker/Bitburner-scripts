import { expect } from 'chai'
import { stockTrader1 } from './stock-trader1'

describe('Algorithmic Stock Trader I', () => {
	it('solves an example', () => {
		const result = stockTrader1([44, 107, 14, 77, 81, 4, 76])
		expect(result).to.equal(72)
	})
})
