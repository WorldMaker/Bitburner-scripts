import { expect } from 'chai'
import { stockTrader2 } from './stock-trader2'

describe('Algorithmic Stock Trader II', () => {
	it('solves a simple example', () => {
		const result = stockTrader2([155, 169, 122])
		expect(result).to.equal(14)
	})
})
