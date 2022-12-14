import { expect } from 'chai'
import { stocktrader3 } from './stock-trader3'

describe('Algorithmic Stock Trader III', () => {
	it('solves an example', () => {
		const result = stocktrader3([
			120, 93, 169, 131, 41, 150, 104, 170, 189, 196, 128, 27, 7, 26, 159, 194,
			25, 172, 198, 150, 104, 187, 143, 46, 106, 189, 112, 166, 136, 47, 95, 55,
			21, 121, 71, 6, 115, 60, 68, 120, 151, 132, 36, 11, 194, 162, 145,
		])
		expect(result).to.equal(379)
	})
})
