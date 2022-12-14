import { expect } from 'chai'
import { sumPartitions } from './total-ways-to-sum1'

describe('Total Ways to Sum', () => {
	const solveExample = (example: number, expected: number) => () => {
		const result = sumPartitions(example)
		expect(result).to.equal(expected)
	}

	it('solves a wild example', solveExample(17, 296))
	it('solves a second wild example', solveExample(36, 17976))
	it('solves a third wild example', solveExample(40, 37337))
})
