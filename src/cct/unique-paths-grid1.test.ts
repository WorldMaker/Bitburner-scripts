import { expect } from 'chai'
import { uniquePathsGrid1 } from './unique-paths-grid1'

describe('Unique Paths in a Grid I', () => {
	it('solves an example', () => {
		const result = uniquePathsGrid1([2, 3])
		expect(result).to.equal(3)
	})
})
