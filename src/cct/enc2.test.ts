import { expect } from 'chai'
import { enc2 } from './enc2'

describe('Encryption II: Vigenère Cipher', () => {
	const encodeExample =
		(text: string, keyword: string, expected: string) => () => {
			const result = enc2([text, keyword])
			expect(result).to.equal(expected)
		}

	it(
		'encodes the given example',
		encodeExample('DASHBOARD', 'LINUX', 'OIFBYZIEX')
	)
	it(
		'encodes a wild example',
		encodeExample(
			'ARRAYCACHEPRINTPOPUPFLASH',
			'PROCESS',
			'PIFCCUSRYSRVAFIGCRYHXARGJ'
		)
	)
})
