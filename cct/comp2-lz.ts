/*
Compression II: LZ Decompression
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. In this variant of LZ, data is encoded in two types of chunk. Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:

1. Exactly L characters, which are to be copied directly into the uncompressed data.
2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: each of the L output characters is a copy of the character X places before it in the uncompressed data.

For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. The two chunk types alternate, starting with type 1, and the final chunk may be of either type.

You are given the following LZ-encoded string:
    91s0aHUm8B926B84176586fy66LQ71566aDc697poisvGC3475kW3aH5
Decode it and output the original string.

Example: decoding '5aaabb450723abb' chunk-by-chunk
    5aaabb           ->  aaabb
    5aaabb45         ->  aaabbaaab
    5aaabb450        ->  aaabbaaab
    5aaabb45072      ->  aaabbaaababababa
    5aaabb450723abb  ->  aaabbaaababababaabb
*/

// const encoded = '91s0aHUm8B926B84176586fy66LQ71566aDc697poisvGC3475kW3aH5'
const encoded =
	'9fbqcyUCxO09HVt6HsNC3110633oyN895vUK86149sLDdlsQGO097ErvlyUkK983sgS652mD953Yvo53'

export function comp2lz(encoded: string) {
	let decoded = ''
	let chunkType: 'direct' | 'referent' = 'direct'
	let encodedPosition = 0

	while (encodedPosition < encoded.length) {
		const length = encoded.charCodeAt(encodedPosition) - '0'.charCodeAt(0)
		if (length > 9 || length < 0) {
			throw new Error(
				`${encoded.charAt(
					encodedPosition
				)} is out of ASCII range 0-9 at position ${encodedPosition}`
			)
		}
		switch (chunkType) {
			case 'direct':
				if (length > encoded.length - encodedPosition - 1) {
					// last chunk may be referent, try again in the other mode
					chunkType = 'referent'
					break
				}
				if (length > 0) {
					const chunk = encoded.slice(
						encodedPosition + 1,
						encodedPosition + length + 1
					)
					decoded = decoded + chunk
					console.log(`direct ${length}: ${chunk}`)
				} else {
					console.log('direct 0')
				}
				encodedPosition += 1 + length
				chunkType = 'referent'
				break
			case 'referent':
				if (length === 0) {
					console.log('referent 0')
					encodedPosition++
					chunkType = 'direct'
					break
				}
				const backlength =
					encoded.charCodeAt(encodedPosition + 1) - '0'.charCodeAt(0)
				if (backlength > 9 || backlength < 0) {
					if (length === encoded.length - encodedPosition - 1) {
						// last chunk may be direct
						chunkType = 'direct'
						break
					}
					throw new Error(
						`${encoded.charAt(
							encodedPosition + 1
						)} is out of ASCII range 0-9 at position ${encodedPosition + 1}`
					)
				}
				const endChunk = decoded.slice(-backlength)
				if (endChunk.length >= length) {
					const chunk = endChunk.slice(0, length)
					decoded = decoded + chunk
					console.log(`referent ${length} ${backlength}: ${chunk}`)
				} else {
					let chunk = ''
					for (let i = 0; i < length; i++) {
						chunk = chunk + endChunk.charAt(i % endChunk.length)
					}
					decoded = decoded + chunk
					console.log(`referent repeat ${length} ${backlength}: ${chunk}`)
				}
				encodedPosition += 2
				chunkType = 'direct'
				break
		}
	}
	return decoded
}

export async function main(ns: NS) {
	const encoded = ns.args[0].toString()
	const decoded = comp2lz(encoded)
	ns.tprint(decoded)
}

const decoded = comp2lz(encoded)
console.log(decoded)
