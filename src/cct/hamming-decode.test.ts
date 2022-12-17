import { expect } from 'chai'
import { decodeHamming } from './hamming-decode'

describe('HammingCodes: Encoded Binary to Integer', () => {
	const decodeExample = (data: string, expected: string) => () => {
		const result = decodeHamming(data)
		expect(result).to.equal(expected)
	}

	it('solves a wild example', decodeExample('1110100000011000', '24'))
})
