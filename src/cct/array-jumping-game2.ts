/*
Array Jumping Game II
You are attempting to solve a Coding Contract. You have 3 tries remaining, after which the contract will self-destruct.


You are given the following array of integers:

2,3,1,1,0,3,2,2,4,1,8,1

Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.

Assuming you are initially positioned at the start of the array, determine the minimum number of jumps to reach the end of the array.

If it's impossible to reach the end, then the answer should be 0.
*/

import { Logger } from 'tslog'

export function arrayJumpingGame2(data: number[], logger?: Logger<any>) {
	if (data.length <= 1) {
		return 0
	}

	if (data.length === 2 && data[0] >= 1) {
		return 1
	}

	logger ??= new Logger({ type: 'hidden' })

	const matrix = new Array(data.length).fill(null as number | null)
	matrix[0] = 0

	for (let i = 0; i < data.length - 1; i++) {
		if (matrix[i] === null) {
			break
		}
		const jump = matrix[i] + 1
		const jumpLength = data[i]
		for (let j = 1; j <= jumpLength && i + j < data.length; j++) {
			matrix[i + j] = Math.min(matrix[i + j] ?? jump, jump)
		}
	}

	logger.debug(matrix)

	return matrix[matrix.length - 1] ?? 0
}
