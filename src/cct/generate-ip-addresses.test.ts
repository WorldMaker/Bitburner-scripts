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

	it('generates an example that exhausts itself in three quads', () => {
		expect(solveGenerateIps('156251145')).to.deep.equal(
			'[1.56.251.145, 15.6.251.145, 15.62.51.145, 156.2.51.145, 156.25.1.145, 156.25.11.45, 156.25.114.5, 156.251.1.45, 156.251.14.5]'
		)
	})
})
