import { expect } from 'chai'
import { evaluateCct } from '.'

describe('Evaluate CCT', () => {
	it('returns an array for find all valid math expressions', async () => {
		const { solver } = evaluateCct('Find All Valid Math Expressions', [
			'742055571',
			-26,
		])
		const result = await solver()
		expect(result).to.have.length.greaterThan(0)
	})
})
