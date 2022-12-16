/*
Subarray with Maximum Sum
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Given the following integer array, find the contiguous subarray (containing at least one number) which has the largest sum and return that sum. 'Sum' refers to the sum of all the numbers in the subarray.
-7,10,6,5,-5,-8,-5,-5,1,-6,-4,-6,-4,-3,5,10,-3,5,2,5,1,0,4,5,5,7,9
*/

import { Logger } from 'tslog'

export function subarrayMaximumSum(data: number[], logger?: Logger<any>) {
	logger ??= new Logger({ type: 'hidden' })

	if (data.length === 0) {
		return 0
	}

	const sumMatrix = Array.from(new Array(data.length), () =>
		new Array(data.length).fill(0)
	)
	for (let start = 0; start < data.length; start++) {
		for (let end = start; end < data.length; end++) {
			if (end === start) {
				sumMatrix[start][end] = data[end]
			} else {
				sumMatrix[start][end] = data[end] + sumMatrix[start][end - 1]
			}
		}
	}

	logger.debug(sumMatrix)

	const maxMatrix = Array.from(new Array(data.length), () =>
		new Array(data.length).fill(0)
	)
	for (let start = 0; start < data.length; start++) {
		for (let end = start; end < data.length; end++) {
			if (end === start && start === 0) {
				maxMatrix[start][end] = sumMatrix[start][end]
			} else if (end === start) {
				maxMatrix[start][end] = Math.max(
					sumMatrix[start][end],
					maxMatrix[start - 1][end]
				)
			} else if (start === 0) {
				maxMatrix[start][end] = Math.max(
					sumMatrix[start][end],
					maxMatrix[start][end - 1]
				)
			} else {
				maxMatrix[start][end] = Math.max(
					sumMatrix[start][end],
					maxMatrix[start - 1][end],
					maxMatrix[start][end - 1]
				)
			}
		}
	}

	logger.debug(maxMatrix)

	return maxMatrix[data.length - 1][data.length - 1]
}
