/*
Unique Paths in a Grid II
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are located in the top-left corner of the following grid:

0,0,0,0,0,0,0,0,
0,0,0,1,0,0,0,0,
1,0,0,0,0,0,0,0,
0,0,0,0,1,1,0,1,
0,0,0,0,0,0,0,1,
0,0,0,0,0,0,1,0,
0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,
0,0,0,0,1,0,0,1,
0,0,0,0,0,0,0,0,
0,1,0,0,0,0,1,0,

You are trying reach the bottom-right corner of the grid, but you can only move down or right on each step. Furthermore, there are obstacles on the grid that you cannot move onto. These obstacles are denoted by '1', while empty spaces are denoted by 0.

Determine how many unique paths there are from start to finish.

NOTE: The data returned for this contract is an 2D array of numbers representing the grid.
*/

const example = [
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 1, 0, 0, 0, 0],
	[1, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 1, 1, 0, 1],
	[0, 0, 0, 0, 0, 0, 0, 1],
	[0, 0, 0, 0, 0, 0, 1, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 1, 0, 0, 1],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 0, 0, 0, 0, 1, 0],
]

export function uniquePathsGrid2(grid: number[][]) {
	if (grid.length === 0) {
		return 0
	}
	if (grid[0].length === 0) {
		return 0
	}
	if (grid[1].length === 1) {
		return grid.some((row) => row[0] === 1) ? 0 : 1
	}
	if (grid[0][0] === 1) {
		return 0
	}

	// 0-filled path matrix
	const matrix = Array.from(grid, (row) => new Array(row.length).fill(0))

	const width = grid[0].length
	const height = grid.length

	for (let row = 0; row < height; row++) {
		for (let column = 0; column < width; column++) {
			if (grid[row][column] === 1) {
				matrix[row][column] = 0
			} else if (row === 0 && column === 0) {
				matrix[row][column] = 1
			} else if (row === 0) {
				matrix[row][column] = matrix[row][column - 1]
			} else if (column === 0) {
				matrix[row][column] = matrix[row - 1][column]
			} else {
				matrix[row][column] = matrix[row][column - 1] + matrix[row - 1][column]
			}
		}
	}

	console.log(matrix)

	return matrix[height - 1][width - 1]
}

export async function main(ns: NS) {
	const grid = JSON.parse(ns.args[0].toString())
	const solution = uniquePathsGrid2(grid)
	ns.tprint(solution)
}

const solution = uniquePathsGrid2(example)
console.log(solution)
