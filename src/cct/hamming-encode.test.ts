import { expect } from 'chai'
import { encodeHamming } from './hamming-encode'

describe('HammingCodes: Integer to Encoded Binary', () => {
	const encodeExample = (n: number, expected: string) => () => {
		const result = encodeHamming(n)
		expect(result).to.equal(expected)
	}

	it('encodes given example 8', encodeExample(8, '11110000'))
	it('encodes given example 21', encodeExample(21, '1001101011'))
	it('encodes a wild example 1755', encodeExample(1755, ''))
})
