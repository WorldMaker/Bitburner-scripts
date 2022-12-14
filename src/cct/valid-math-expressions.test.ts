import { expect } from 'chai'
import { solveValidMathExpressions } from './valid-math-expressions'

describe('Find All Valid Math Expressions', () => {
	it('solves given examples', () => {
		const result1 = solveValidMathExpressions(['123', 6])
		expect(result1).to.deep.equal(['1*2*3', '1+2+3'])

		const result2 = solveValidMathExpressions(['105', 5])
		expect(result2).to.deep.equal(['1*0+5', '10-5'])
	})
})
