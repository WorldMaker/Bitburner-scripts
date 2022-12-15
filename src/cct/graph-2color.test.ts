import { expect } from 'chai'
import { colorBipartiteGraph, GraphEdgeList } from './graph-2color'

describe('Proper 2-Coloring of a Graph', () => {
	it('solves given 4 vertex example', () => {
		const result1 = colorBipartiteGraph([
			4,
			[
				[0, 2],
				[0, 3],
				[1, 2],
				[1, 3],
			],
		])
		expect(result1).to.deep.equal([0, 0, 1, 1])
	})

	it('solves given non-bipartite example (triangle)', () => {
		const result2 = colorBipartiteGraph([
			3,
			[
				[0, 1],
				[0, 2],
				[1, 2],
			],
		])
		expect(result2).to.deep.equal([])
	})

	it('solves another found example', () => {
		const example: GraphEdgeList = [
			12,
			[
				[7, 11],
				[0, 2],
				[0, 5],
				[6, 10],
				[2, 4],
				[1, 3],
				[9, 11],
				[5, 11],
				[10, 11],
				[0, 10],
				[5, 6],
				[6, 9],
				[1, 5],
				[4, 8],
				[4, 5],
				[0, 3],
				[3, 11],
				[3, 4],
			],
		]
		const result = colorBipartiteGraph(example)
		expect(result).to.deep.equal([0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0])
	})

	it('does not infinite loop on larger invalid loop', () => {
		const result = colorBipartiteGraph([
			11,
			[
				[2, 8],
				[2, 10],
				[6, 8],
				[1, 4],
				[6, 7],
				[3, 8],
				[8, 10],
				[2, 4],
				[8, 9],
				[1, 5],
				[2, 3],
				[1, 10],
				[0, 2],
				[1, 9],
				[4, 8],
			],
		])
		expect(result).to.deep.equal([])
	})
})
