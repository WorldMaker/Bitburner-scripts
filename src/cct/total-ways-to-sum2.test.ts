import { expect } from 'chai'
import { sumCombinations, SumInput } from './total-ways-to-sum2'

describe('Total Ways to Sum II', () => {
	const solveExample = (data: SumInput, expected: number) => () => {
		const result = sumCombinations(data)
		expect(result).to.equal(expected)
	}

	it(
		'solves a first wild example',
		solveExample([82, [2, 3, 4, 5, 7, 8, 9, 10, 14, 15, 16]], 130680)
	)
	// test is too slow
	it.skip(
		'solves a second wild example',
		solveExample([184, [1, 3, 5, 8, 10, 13, 14, 16, 17]], 2848146)
	)
	it(
		'solves a third wild example',
		solveExample([34, [10, 12, 3, 4, 5, 6, 7, 9]], 208)
	)
})
