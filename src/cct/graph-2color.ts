/*
Proper 2-Coloring of a Graph
You are attempting to solve a Coding Contract. You have 5 tries remaining, after which the contract will self-destruct.


You are given the following data, representing a graph:
[12,[[7,11],[0,2],[0,5],[6,10],[2,4],[1,3],[9,11],[5,11],[10,11],[0,10],[5,6],[6,9],[1,5],[4,8],[4,5],[0,3],[3,11],[3,4]]]
Note that "graph", as used here, refers to the field of graph theory, and has no relation to statistics or plotting. The first element of the data represents the number of vertices in the graph. Each vertex is a unique number between 0 and 11. The next element of the data represents the edges of the graph. Two vertices u,v in a graph are said to be adjacent if there exists an edge [u,v]. Note that an edge [u,v] is the same as an edge [v,u], as order does not matter. You must construct a 2-coloring of the graph, meaning that you have to assign each vertex in the graph a "color", either 0 or 1, such that no two adjacent vertices have the same color. Submit your answer in the form of an array, where element i represents the color of vertex i. If it is impossible to construct a 2-coloring of the given graph, instead submit an empty array.

Examples:

Input: [4, [[0, 2], [0, 3], [1, 2], [1, 3]]]
Output: [0, 0, 1, 1]

Input: [3, [[0, 1], [0, 2], [1, 2]]]
Output: []
*/

export type GraphEdgeList = [number, Array<[number, number]>]

export interface ColorNode {
	id: number
	edges: Set<number>
	color: number | null
}

function colorNode(graph: ColorNode[], id: number, color = 0): boolean {
	const node = graph[id]
	let valid = true
	if (node.color === null) {
		node.color = color
		for (const edge of node.edges) {
			valid &&= colorNode(graph, edge, color === 0 ? 1 : 0)
		}
		return valid
	} else if (node.color === color) {
		return true
	} else {
		return false
	}
}

export function colorBipartiteGraph([nodeCount, edges]: GraphEdgeList) {
	const graph = Array.from(
		new Array(nodeCount),
		(_v, i) => ({ id: i, edges: new Set(), color: null } as ColorNode)
	)

	for (const [a, b] of edges) {
		graph[a].edges.add(b)
		graph[b].edges.add(a)
	}

	let valid = colorNode(graph, 0, 0)

	let uncolored = graph.filter((node) => node.color === null)

	while (valid && uncolored.length) {
		valid &&= colorNode(graph, uncolored[0].id, 0)
		uncolored = graph.filter((node) => node.color === null)
	}

	if (valid) {
		return graph.map((node) => node.color)
	} else {
		return []
	}
}

export async function main(ns: NS) {
	const edgeList = JSON.parse(ns.args[0].toString())
	const result = colorBipartiteGraph(edgeList)
	ns.tprint(JSON.stringify(result))
}
