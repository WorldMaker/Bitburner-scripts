import { expect } from 'chai'
import { solveGenerateIps } from './generate-ip-addresses'

describe('Generate IP Addresses', () => {
	it('generates given examples', () => {
		expect(solveGenerateIps('25525511135')).to.equal(
			'[255.255.11.135, 255.255.111.35]'
		)
		expect(solveGenerateIps('1938718066')).to.equal('[193.87.180.66]')
	})

	it('generates another simple example', () => {
		const result = solveGenerateIps('2228490113')
		expect(result).to.equal('[222.84.90.113]')
	})
})
