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

import { AsyncIterableX } from '@reactivex/ix-esnext-esm/asynciterable/asynciterablex'
import { orderByDescending } from '@reactivex/ix-esnext-esm/asynciterable/operators/orderby'
import { first } from '@reactivex/ix-esnext-esm/asynciterable/first'
import { Logger } from 'tslog'
import { Cooperative } from '.'
import { TemplateLogger } from '../logging/template-logger'

const { from } = AsyncIterableX

interface Reference {
	position: number
	count: number
	offset: number
}

async function* findLargestReferences(
	input: string,
	start: number,
	end: number,
	lookahead: number,
	cooperative: Cooperative,
	logger: TemplateLogger
): AsyncIterable<Reference> {
	const searchStart =
		lookahead > 0 ? Math.max(end + lookahead - 9, end - 3) : end - 3
	const searchEnd = lookahead > 0 ? end + lookahead : end
	logger.trace`searching ${start} to ${end} with lookahead ${lookahead}; ${searchStart}, ${searchEnd}`
	let longestReference = 2 // references are best used >= 3
	for (let position = searchStart; position >= start; position--) {
		const dictionary = input.slice(Math.max(0, position - 9), position)
		for (
			let referentCount = Math.min(9, searchEnd - position);
			referentCount > longestReference;
			referentCount--
		) {
			const encodable = input.slice(position, position + referentCount)
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
				if (encodable === chunk) {
					longestReference = referentCount
					yield {
						position,
						count: referentCount,
						offset: referentOffset,
					}
					if (referentCount === 9) {
						// maximum possible reference size, we can greedily stop searching
						return
					}
					await cooperative(
						() => `finding compression references @ ${position}`
					)
				}
			}
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
	let start = 1 // we need to start with a direct, so our first search starts at 1

	while (start < input.length) {
		const end = Math.min(input.length, start + 9)
		// lookahead most of 3 "windows" ahead
		const furthestPossible = 3 * 9 - 1
		const remaining = input.length - end
		const lookahead = Math.min(remaining, furthestPossible)
		const bestReference = await first(
			from(
				findLargestReferences(input, start, end, lookahead, cooperative, logger)
			).pipe(orderByDescending((ref) => ref.count))
		)

		if (bestReference) {
			const references = [bestReference]
			let distance = references[0].position - start
			// additional references make sense if they can encode 3 or more
			while (distance >= 3) {
				const nextBestReference = await first(
					from(
						findLargestReferences(
							input,
							start,
							references[0].position,
							0,
							cooperative,
							logger
						)
					).pipe(orderByDescending((ref) => ref.count))
				)
				if (nextBestReference) {
					references.unshift(nextBestReference)
					distance = references[0].position - start
				} else {
					break
				}
			}

			let reference = references.shift()
			while (reference) {
				let direct = reference.position - position
				if (direct === 0) {
					logger.debug`skip direct`
					compressed += '0'
				} else {
					while (direct > 9) {
						// worst case: 9 direct, no referent
						const directChunk = input.slice(position, position + 9)
						const compressedChunk = `9${directChunk}0`
						logger.debug`${directChunk}: ${compressedChunk}`
						compressed += compressedChunk
						direct -= 9
						position += 9
					}
					const directChunk = input.slice(position, position + direct)
					const compressedChunk = `${direct}${directChunk}`
					logger.debug`${directChunk}: ${compressedChunk}`
					compressed += compressedChunk
				}
				const referenceChunk = input.slice(
					reference.position,
					reference.position + reference.count
				)
				const compressedReference = `${reference.count}${reference.offset}`
				logger.debug`${referenceChunk}: ${compressedReference}`
				compressed += compressedReference

				position = reference.position + reference.count
				start = position
				reference = references.shift()
			}
		} else {
			// no references in window, only direct
			const chunk = input.slice(position, position + 9)
			if (chunk.length < 9) {
				// best case: final chunk of the input
				const compressedChunk = `${chunk.length}${chunk}`
				logger.debug`${chunk}: ${compressedChunk}`
				compressed += compressedChunk
				position += 9
				start = position
			} else {
				// worst case: 9 direct, no referent
				const compressedChunk = `9${chunk}0`
				logger.debug`${chunk}: ${compressedChunk}`
				compressed += compressedChunk
				position += 9
				start = position + 1 // skip one because next must be at least 1 direct next
			}
		}

		await cooperative(() => `compressing @ ${position}`)
	}

	return compressed
}
