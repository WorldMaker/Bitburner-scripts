import { expect } from 'chai'
import { comp1rle } from './comp1-rle'

describe('Compression I: RLE Compression', () => {
	const encodeExample = (text: string, expected: string) => () => {
		const result = comp1rle(text)
		expect(result).to.equal(expected)
	}
	/*
    aaaaabccc            ->  5a1b3c
    aAaAaA               ->  1a1A1a1A1a1A
    111112333            ->  511233
    zzzzzzzzzzzzzzzzzzz  ->  9z9z1z  (or 9z8z2z, etc.)
    */
	it('encodes the first given example', encodeExample('aaaaabccc', '5a1b3c'))
	it(
		'encodes the second given example',
		encodeExample('aAaAaA', '1a1A1a1A1a1A')
	)
	it('encodes the third given example', encodeExample('111112333', '511233'))
	it(
		'encodes the fourth given example',
		encodeExample('zzzzzzzzzzzzzzzzzzz', '9z9z1z')
	)
	it(
		'encodes a wild example',
		encodeExample(
			'iiyyyyyyyyyyyyyy33333333333333YsR8TTTTTTTT55555555egzzzzzz3333333xxMJJ66666BBBB',
			'2i9y5y93531Y1s1R188T851e1g6z732x1M2J564B'
		)
	)
})
