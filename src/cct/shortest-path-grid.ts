/*
Shortest Path in a Grid
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are located in the top-left corner of the following grid:

  [[0,0,0,0,0,1],
   [1,1,0,0,0,0],
   [0,0,1,0,0,0],
   [0,0,0,0,1,0],
   [0,0,0,0,0,0],
   [0,0,1,1,0,1],
   [0,0,0,0,0,0],
   [0,0,0,0,0,0]]

You are trying to find the shortest path to the bottom-right corner of the grid, but there are obstacles on the grid that you cannot move onto. These obstacles are denoted by '1', while empty spaces are denoted by 0.

Determine the shortest path from start to finish, if one exists. The answer should be given as a string of UDLR characters, indicating the moves along the path

NOTE: If there are multiple equally short paths, any of them is accepted as answer. If there is no path, the answer should be an empty string.
NOTE: The data returned for this contract is an 2D array of numbers representing the grid.

Examples:

    [[0,1,0,0,0],
     [0,0,0,1,0]]

Answer: 'DRRURRD'

    [[0,1],
     [1,0]]

Answer: ''
*/

type Direction = 'D' | 'L' | 'R' | 'U'

interface GridNode {
	row: number
	column: number
	value: number
	parent?: GridNode
	parentDirection?: Direction
	destination: boolean
	explored: boolean
}

function parentDirections(node: GridNode): string {
	const directions: string[] = []
	while (node.parent) {
		directions.unshift(node.parentDirection!)
		node = node.parent
	}
	return directions.join('')
}

export function shortestGridPath(data: number[][]) {
	if (data.length === 0) {
		return ''
	}

	const rowLength = data[0].length

	if (
		rowLength === 0 ||
		data[0][0] === 1 ||
		data[data.length - 1][rowLength - 1] === 1
	) {
		return ''
	}

	const nodes: GridNode[][] = Array.from(new Array(data.length), (_, row) =>
		Array.from(new Array(rowLength), (_, column) => ({
			row,
			column,
			value: data[row][column],
			explored: false,
			// destination is the bottom right corner
			destination: row === data.length - 1 && column === rowLength - 1,
		}))
	)

	// *** Breadth first search ***

	const q: GridNode[] = []
	const start = nodes[0][0]
	start.explored = true
	q.push(start)
	while (q.length) {
		const node = q.shift()!
		if (node.destination) {
			return parentDirections(node)
		}
		// down
		if (node.row + 1 < data.length) {
			const down = nodes[node.row + 1][node.column]
			if (!down.explored) {
				down.explored = true
				if (down.value === 0) {
					down.parent = node
					down.parentDirection = 'D'
					q.push(down)
				}
			}
		}
		// right
		if (node.column + 1 < rowLength) {
			const right = nodes[node.row][node.column + 1]
			if (!right.explored) {
				right.explored = true
				if (right.value === 0) {
					right.parent = node
					right.parentDirection = 'R'
					q.push(right)
				}
			}
		}
		// left
		if (node.column - 1 >= 0) {
			const left = nodes[node.row][node.column - 1]
			if (!left.explored) {
				left.explored = true
				if (left.value === 0) {
					left.parent = node
					left.parentDirection = 'L'
					q.push(left)
				}
			}
		}
		// up
		if (node.row - 1 >= 0) {
			const up = nodes[node.row - 1][node.column]
			if (!up.explored) {
				up.explored = true
				if (up.value === 0) {
					up.parent = node
					up.parentDirection = 'U'
					q.push(up)
				}
			}
		}
	}
	return ''
}
