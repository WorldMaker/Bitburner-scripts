import { expect } from 'chai'
import { comp2lz } from './comp2-lz'

describe('Compression II: LZ Decompression', () => {
	it('decodes the given chunked example', () => {
		expect(comp2lz('5aaabb')).to.equal('aaabb')
		expect(comp2lz('5aaabb45')).to.equal('aaabbaaab')
		expect(comp2lz('5aaabb450')).to.equal('aaabbaaab')
		expect(comp2lz('5aaabb45072')).to.equal('aaabbaaababababa')
		expect(comp2lz('5aaabb450723abb')).to.equal('aaabbaaababababaabb')
	})

	it('decodes its first example', () => {
		const result = comp2lz(
			'91s0aHUm8B926B84176586fy66LQ71566aDc697poisvGC3475kW3aH5'
		)
		expect(result).to.equal(
			'1s0aHUm8B8B8B8B8B8B84176B8B84fy66LQQQQQQQQ66aDcQQQQ66poisvGCsvG5kW3aH5'
		)
	})

	it('decodes an example with referent [Type 2] 0', () => {
		const result = comp2lz(
			'9fbqcyUCxO09HVt6HsNC3110633oyN895vUK86149sLDdlsQGO097ErvlyUkK983sgS652mD953Yvo53'
		)
		expect(result).to.equal(
			'fbqcyUCxOHVt6HsNC33C33C33oyNC33C33oyvUK86UsLDdlsQGO7ErvlyUkKErvlyUkKEsgSKEsgSKmDgSKmDgSKmYvoYvoYv'
		)
	})
})
