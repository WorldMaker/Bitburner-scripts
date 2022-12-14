import { expect } from 'chai'
import { enc1caeser } from './enc1-caesar'

describe('Encryption I: Caesar Cipher', () => {
	it('decodes a basic example', () => {
		const result = enc1caeser(['FLASH TRASH ARRAY LOGIC EMAIL', 3])
		expect(result).to.equal('CIXPE QOXPE XOOXV ILDFZ BJXFI')
	})
})
