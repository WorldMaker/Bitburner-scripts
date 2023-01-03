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

import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import {
	orderByDescending,
	thenBy,
	thenByDescending,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { take } from '@reactivex/ix-esnext-esm/iterable/operators/take'
import { Logger } from 'tslog'
import { Cooperative } from '.'
import { TemplateLogger } from '../logging/template-logger'

const { from } = IterableX

interface CompressionOption {
	compressedChunk: string
	nextPosition: number
}

function* compressReferentOptions(
	directChunk: string,
	input: string,
	dictionary: string,
	position: number,
	direct: number,
	maxPosition: number,
	logger: TemplateLogger
): Iterable<CompressionOption> {
	if (!dictionary) {
		return
	}
	const nextInput = input.slice(position + direct, position + direct + 9)
	for (let referentCount = 9; referentCount > 0; referentCount--) {
		for (
			let referentOffset = 1;
			referentOffset <= dictionary.length;
			referentOffset++
		) {
			const endChunk = dictionary.slice(-referentOffset)
			let chunk = ''
			for (let i = 0; i < referentCount; i++) {
				chunk += endChunk.charAt(i % endChunk.length)
			}
			const referentPosition = position + direct
			if (nextInput.startsWith(chunk)) {
				const compressedChunk = `${direct}${directChunk}${referentCount}${referentOffset}`
				const nextPosition = referentPosition + referentCount
				yield { compressedChunk, nextPosition }
				// if we didn't eat the entire next input, try to find the next smallest chunk
				if (referentCount < nextInput.length && nextPosition < maxPosition) {
					for (const nextDirect of compressDirectOptions(
						input,
						nextPosition,
						maxPosition,
						logger
					)) {
						yield {
							compressedChunk: `${compressedChunk}${nextDirect.compressedChunk}`,
							nextPosition: nextDirect.nextPosition,
						}
					}
				}
			}
		}
	}
}

function* compressDirectOptions(
	input: string,
	position: number,
	maxPosition: number,
	logger: TemplateLogger
) {
	if (position > maxPosition) {
		return
	}
	for (let direct = 0; direct <= 9; direct++) {
		if (direct === input.length - position) {
			const chunk = input.slice(position, position + direct)
			yield {
				compressedChunk: `${direct}${chunk}`,
				nextPosition: position + direct,
			}
			return
		}
		const directChunk = input.slice(position, position + direct)
		const encoded = input.slice(0, position)
		const dictionary =
			(direct < 9 ? encoded.slice(-(9 - direct)) : '') + directChunk
		if (!dictionary) {
			continue
		}
		for (const referentOption of compressReferentOptions(
			directChunk,
			input,
			dictionary,
			position,
			direct,
			maxPosition,
			logger
		)) {
			yield referentOption
		}
	}
}

export async function comp3lzComp(
	input: string,
	cooperative: Cooperative,
	baseLogger?: Logger<any>
): Promise<string> {
	const logger = new TemplateLogger(
		baseLogger ?? new Logger({ type: 'hidden' })
	)

	let compressed = ''
	if (input.length === 0) {
		return compressed
	}

	let position = 0
	while (position < input.length) {
		const bestOption = [
			...from(
				compressDirectOptions(input, position, position + 9, logger)
			).pipe(
				orderByDescending((option) => option.nextPosition),
				thenBy((option) => option.compressedChunk.length),
				thenByDescending((option) => option.compressedChunk),
				take(1)
			),
		][0]

		if (bestOption) {
			logger.debug`${input.slice(position, bestOption.nextPosition)}: ${
				bestOption.compressedChunk
			}`
			compressed += bestOption.compressedChunk
			position = bestOption.nextPosition
		} else {
			// worst case: 9 direct, no referent
			const chunk = input.slice(position, position + 9)
			const compressedChunk = `9${chunk}0`
			logger.debug`${chunk}: ${compressedChunk}`
			compressed += compressedChunk
			position += 9
		}

		await cooperative(() => `compressing @ ${position}`)
	}

	return compressed
}
