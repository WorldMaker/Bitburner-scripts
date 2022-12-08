/*
Unique Paths in a Grid I
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are in a grid with 2 rows and 3 columns, and you are positioned in the top-left corner of that grid. You are trying to reach the bottom-right corner of the grid, but you can only move down or right on each step. Determine how many unique paths there are from start to finish.

NOTE: The data returned for this contract is an array with the number of rows and columns:

[2, 3] 
 */

import { uniquePathsGrid2 } from './unique-paths-grid2.js'

const example = [2, 3]

export async function main(ns: NS) {
	const [rows, columns] = ns.args
	const zeroMatrix = Array.from(new Array(Number(rows)), () =>
		new Array(Number(columns)).fill(0)
	)
	const result = uniquePathsGrid2(zeroMatrix)
	ns.tprint(result)
}

const zeroMatrix = Array.from(new Array(example[0]), () =>
	new Array(Number(example[1])).fill(0)
)
const result = uniquePathsGrid2(zeroMatrix)
console.log(result)
