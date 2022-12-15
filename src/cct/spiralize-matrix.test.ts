import { expect } from 'chai'
import { spiralizeMatrix } from './spiralize-matrix'

describe('Spiralize Matrix', () => {
	const solveExample = (data: number[][], expected: number[]) => () => {
		const result = spiralizeMatrix(data)
		expect(result).to.deep.equal(expected)
	}

	it(
		'solves the given square example',
		solveExample(
			[
				[1, 2, 3],
				[4, 5, 6],
				[7, 8, 9],
			],
			[1, 2, 3, 6, 9, 8, 7, 4, 5]
		)
	)

	it(
		'solves the given non-square example',
		solveExample(
			[
				[1, 2, 3, 4],
				[5, 6, 7, 8],
				[9, 10, 11, 12],
			],
			[1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
		)
	)

	it(
		'solves a wild example',
		solveExample(
			[
				[44, 30, 8, 1, 34],
				[30, 18, 49, 12, 19],
				[30, 42, 44, 2, 17],
				[19, 10, 35, 19, 4],
				[32, 18, 19, 36, 10],
				[1, 17, 30, 19, 20],
				[45, 6, 49, 30, 29],
				[2, 15, 13, 13, 2],
				[28, 32, 2, 18, 30],
				[39, 39, 26, 31, 16],
			],
			[
				44, 30, 8, 1, 34, 19, 17, 4, 10, 20, 29, 2, 30, 16, 31, 26, 39, 39, 28,
				2, 45, 1, 32, 19, 30, 30, 18, 49, 12, 2, 19, 36, 19, 30, 13, 18, 2, 32,
				15, 6, 17, 18, 10, 42, 44, 35, 19, 30, 49, 13,
			]
		)
	)
})
