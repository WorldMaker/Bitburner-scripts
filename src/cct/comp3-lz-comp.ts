/*
Compression III: LZ Compression
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. In this variant of LZ, data is encoded in two types of chunk. Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:

1. Exactly L characters, which are to be copied directly into the uncompressed data.
2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: each of the L output characters is a copy of the character X places before it in the uncompressed data.

For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. The two chunk types alternate, starting with type 1, and the final chunk may be of either type.

You are given the following input string:
    xiv4Nv4Nv4Nv4DBe7XBe7XBe7Xqtyt7lZlZlZlZloqZla6oyiAyupvwzSg4UWkwzSj0kwzSj0k1s0Q
Encode it using Lempel-Ziv encoding with the minimum possible output length.

Examples (some have other possible encodings of minimal length):
    abracadabra     ->  7abracad47
    mississippi     ->  4miss433ppi
    aAAaAAaAaAA     ->  3aAA53035
    2718281828      ->  627182844
    abcdefghijk     ->  9abcdefghi02jk
    aaaaaaaaaaaa    ->  3aaa91
    aaaaaaaaaaaaa   ->  1a91031
    aaaaaaaaaaaaaa  ->  1a91041
*/

import { Logger } from 'tslog'
import { TemplateLogger } from '../logging/template-logger'

function compressReferent(
	directChunk: string,
	nextInput: string,
	dictionary: string,
	position: number,
	direct: number,
	logger: TemplateLogger
) {
	for (let referentCount = 9; referentCount > 0; referentCount--) {
		for (let referentOffset = 1; referentOffset <= 9; referentOffset++) {
			const endChunk = dictionary.slice(-referentOffset)
			let chunk = ''
			for (let i = 0; i < referentCount; i++) {
				chunk += endChunk.charAt(i % endChunk.length)
			}
			const referentPosition = position + direct
			if (nextInput.startsWith(chunk)) {
				logger.debug`direct ${direct}: ${directChunk}`
				logger.debug`referent ${referentCount} ${referentOffset}: ${chunk}`
				const compressedChunk = `${direct}${directChunk}${referentCount}${referentOffset}`
				const nextPosition = referentPosition + referentCount + 1
				return { found: true, compressedChunk, nextPosition }
			}
		}
	}
	return { found: false, compressedChunk: '', nextPosition: position }
}

export function comp3lzComp(input: string, baseLogger?: Logger<any>): string {
	const logger = new TemplateLogger(
		baseLogger ?? new Logger({ type: 'hidden' })
	)

	let compressed = ''
	if (input.length === 0) {
		return compressed
	}

	let position = 0
	while (position < input.length) {
		let updatedPosition = false
		for (let direct = 1; direct <= 9; direct++) {
			if (direct === input.length - position) {
				const chunk = input.slice(position, position + direct)
				logger.debug`Final ${direct} direct: ${chunk}`
				compressed += `${direct}${chunk}`
				position += direct + 1
				updatedPosition = true
				break
			}
			const directChunk = input.slice(position, position + direct)
			const nextInput = input.slice(position + direct, position + 9)
			const encoded = input.slice(0, position)
			const dictionary =
				encoded.slice(-(9 - direct)) + input.slice(position, direct)
			const { found, compressedChunk, nextPosition } = compressReferent(
				directChunk,
				nextInput,
				dictionary,
				position,
				direct,
				logger
			)
			if (found) {
				compressed += compressedChunk
				position = nextPosition
				updatedPosition = true
				break
			}
		}
		if (!updatedPosition && position > 0) {
			// try direct 0 (which generally encodes longer)
			const encoded = input.slice(0, position)
			const dictionary = encoded.slice(-9)
			const nextInput = input.slice(position, position + 9)
			const { found, compressedChunk, nextPosition } = compressReferent(
				'',
				nextInput,
				dictionary,
				position,
				0,
				logger
			)
			if (found) {
				compressed += compressedChunk
				position = nextPosition
				updatedPosition = true
			}
		}

		if (!updatedPosition) {
			// worst case: 9 direct, no referent
			const chunk = input.slice(position, 9)
			logger.debug`9 direct, referent 0: ${chunk}`
			compressed += `9${chunk}0`
			position += 9
			updatedPosition = true
		}
	}

	return compressed
}
