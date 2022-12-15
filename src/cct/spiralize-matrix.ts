/*
Spiralize Matrix
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Given the following array of arrays of numbers representing a 2D matrix, return the elements of the matrix as an array in spiral order:

    [
        [44,30, 8, 1,34]
        [30,18,49,12,19]
        [30,42,44, 2,17]
        [19,10,35,19, 4]
        [32,18,19,36,10]
        [ 1,17,30,19,20]
        [45, 6,49,30,29]
        [ 2,15,13,13, 2]
        [28,32, 2,18,30]
        [39,39,26,31,16]
    ]

Here is an example of what spiral order should be:

    [
        [1, 2, 3]
        [4, 5, 6]
        [7, 8, 9]
    ]

Answer: [1, 2, 3, 6, 9, 8 ,7, 4, 5]

Note that the matrix will not always be square:

    [
        [1,  2,  3,  4]
        [5,  6,  7,  8]
        [9, 10, 11, 12]
    ]

Answer: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
*/

export function spiralizeMatrix(data: number[][]) {
	const result: number[] = []
	if (data.length === 0) {
		return result
	}
	let rowmin = 0
	let rowmax = data.length
	let colmin = 0
	let colmax = data[0].length
	let row = 0
	let col = 0
	let direction: ['row' | 'col', -1 | 1] = ['col', 1]
	while (row >= rowmin && row < rowmax && col >= colmin && col < colmax) {
		result.push(data[row][col])
		switch (direction[0]) {
			case 'row':
				row += direction[1]
				if (row < rowmin) {
					// bumped top, head right
					row++
					col++
					colmin++
					direction = ['col', 1]
				} else if (row >= rowmax) {
					// bumped bottom, head left
					row--
					col--
					colmax--
					direction = ['col', -1]
				}
				break
			case 'col':
				col += direction[1]
				if (col < colmin) {
					// bumped left, head up
					col++
					row--
					rowmax--
					direction = ['row', -1]
				} else if (col >= colmax) {
					// bumped right, head down
					col--
					row++
					rowmin++
					direction = ['row', 1]
				}
				break
		}
	}
	return result
}
