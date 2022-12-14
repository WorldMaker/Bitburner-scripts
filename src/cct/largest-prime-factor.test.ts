import { expect } from 'chai'
import { largestPrimeFactor } from './largest-prime-factor'

describe('Find Largest Prime Factor', () => {
	it('solves an example', () => {
		const result = largestPrimeFactor(995480028)
		expect(result).to.equal(124001)
	})
})
