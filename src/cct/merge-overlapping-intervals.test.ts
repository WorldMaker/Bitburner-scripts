import { expect } from 'chai'
import { mergeOverlappingIntervals } from './merge-overlapping-intervals'

describe('Merge Overlapping Intervals', () => {
	const solveExample =
		(data: [number, number][], expected: [number, number][]) => () => {
			const result = mergeOverlappingIntervals(data)
			expect(result).to.deep.equal(expected)
		}

	it(
		'should solve given example',
		solveExample(
			[
				[1, 3],
				[8, 10],
				[2, 6],
				[10, 16],
			],
			[
				[1, 6],
				[8, 16],
			]
		)
	)

	it(
		'should solve a wild example',
		solveExample(
			[
				[23, 32],
				[13, 21],
				[11, 21],
				[10, 16],
				[9, 13],
				[11, 13],
				[3, 5],
				[9, 15],
				[14, 24],
				[4, 6],
			],
			[
				[3, 6],
				[9, 32],
			]
		)
	)
})
