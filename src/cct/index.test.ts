import { expect } from 'chai'
import { evaluateCct } from '.'

describe('Evaluate CCT', () => {
	it('returns an array for find all valid math expressions', async () => {
		const { result } = await evaluateCct('Find All Valid Math Expressions', [
			'742055571',
			-26,
		])
		expect(result).to.have.length.greaterThan(0)
	})
})
