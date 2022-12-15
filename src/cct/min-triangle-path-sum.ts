/*
Minimum Path Sum in a Triangle
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Given a triangle, find the minimum path sum from top to bottom. In each step of the path, you may only move to adjacent numbers in the row below. The triangle is represented as a 2D array of numbers:

[
      [5],
     [6,5],
    [1,1,2],
   [7,8,3,5],
  [4,3,2,1,6]
]

Example: If you are given the following triangle:

[
     [2],
    [3,4],
   [6,5,7],
  [4,1,8,3]
]

The minimum path sum is 11 (2 -> 3 -> 5 -> 1).
*/

import { Logger } from 'tslog'

export function minimumTrianglePathSum(
	pyramid: number[][],
	logger?: Logger<any>
): number {
	logger ??= new Logger({ type: 'hidden' })

	if (pyramid.length < 1) {
		return 0
	}
	if (pyramid.length === 1) {
		return pyramid[0][0]
	}

	const matrix = Array.from(pyramid, (row) => new Array(row.length).fill(0))

	for (let row = pyramid.length - 1; row >= 0; row--) {
		for (let column = 0; column < pyramid[row].length; column++) {
			if (row === pyramid.length - 1) {
				// bottom row is just a copy
				matrix[row][column] = pyramid[row][column]
			} else {
				// current path + minimum path of both children
				const columnLeft = column
				const columnRight = column + 1
				matrix[row][column] =
					pyramid[row][column] +
					Math.min(matrix[row + 1][columnLeft], matrix[row + 1][columnRight])
			}
		}
	}
	logger.debug(matrix)

	return matrix[0][0]
}

export async function main(ns: NS) {
	const pyramid = JSON.parse(ns.args[0].toString())
	const solution = minimumTrianglePathSum(pyramid)
	ns.tprint(solution)
}
