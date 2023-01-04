import { expect } from 'chai'
import { decodeHamming } from './hamming-decode'

describe('HammingCodes: Encoded Binary to Integer', () => {
	const decodeExample = (data: string, expected: string) => () => {
		const result = decodeHamming(data)
		expect(result).to.equal(expected)
	}

	it('solves a wild example', decodeExample('1110100000011000', '24'))

	it(
		'solves a wild example that is a single error 1 to 0',
		decodeExample(
			'1110000000000101000011000001001101010000110100000111010011110101',
			// '1110000000000101000011000001001101010000110100000111010011110101': position XOR = 53
			// '1110000000000101000011000001001101010000110100000111000011110101': bit flip 53
			// '000001010001100000100111010000110100000111000011110101' data part
			'358482948681973'
		)
	)

	it(
		'solves a wild example that is a single error 0 to 1',
		decodeExample(
			'01000001110101101101001100001101',
			// '01000001110101101101001100001101': position XOR = 2
			// '01100001110101101101001100001101': bit flip 2
			// '00011010110101001100001101' data part
			'7033613'
		)
	)
})
