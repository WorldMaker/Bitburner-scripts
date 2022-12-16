import { expect } from 'chai'
import { shortestGridPath } from './shortest-path-grid'

describe('Shortest Path in a Grid', () => {
	const solveExample = (data: number[][], expected: string) => () => {
		const result = shortestGridPath(data)
		expect(result).to.equal(expected)
	}

	it(
		'solves the given possible maze',
		solveExample(
			[
				[0, 1, 0, 0, 0],
				[0, 0, 0, 1, 0],
			],
			'DRRURRD'
		)
	)

	it(
		'solves the given impossible maze',
		solveExample(
			[
				[0, 1],
				[1, 0],
			],
			''
		)
	)

	it(
		'solves a wild example',
		solveExample(
			[
				[0, 0, 0, 0, 0, 1],
				[1, 1, 0, 0, 0, 0],
				[0, 0, 1, 0, 0, 0],
				[0, 0, 0, 0, 1, 0],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 1, 1, 0, 1],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
			],
			'RRDRDDDRDDDR'
		)
	)
})
