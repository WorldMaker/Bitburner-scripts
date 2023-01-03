/*
Total Ways to Sum
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


It is possible write four as a sum in exactly four different ways:

    3 + 1
    2 + 2
    2 + 1 + 1
    1 + 1 + 1 + 1

How many different distinct ways can the number 17 be written as a sum of at least two positive integers?
*/

import { AsyncIterableX } from '@reactivex/ix-esnext-esm/asynciterable/asynciterablex'
import { memoize } from '@reactivex/ix-esnext-esm/asynciterable/operators/memoize'
import { Cooperative } from '.'

const { from } = AsyncIterableX

class MemoMap {
	private map = new Map<number, Map<number, AsyncIterable<number[]>>>()

	get(n: number, i: number) {
		if (this.map.has(n)) {
			return this.map.get(n)!.get(i)
		}
		return undefined
	}

	set(n: number, i: number, value: AsyncIterable<number[]>) {
		let nmap = this.map.get(n)
		if (!nmap) {
			nmap = new Map<number, AsyncIterable<number[]>>()
			this.map.set(n, nmap)
		}
		nmap.set(i, value)
	}
}

async function* partition(
	n: number,
	cooperative: Cooperative,
	I = 1,
	memo = new MemoMap()
): AsyncIterable<number[]> {
	yield [n]
	for (let i = I; i < Math.floor(n / 2) + 1; i++) {
		for await (const p of memoizePartition(n - i, cooperative, i, memo)) {
			yield [i, ...p]
		}
	}
	await cooperative(() => `partioning ${n}; ${I}`)
}

function memoizePartition(
	n: number,
	cooperative: Cooperative,
	I = 1,
	memo = new MemoMap()
): AsyncIterable<number[]> {
	const existing = memo.get(n, I)
	if (existing) {
		return existing
	}
	const value = from(partition(n, cooperative, I, memo)).pipe(memoize())
	memo.set(n, I, value)
	return value
}

export async function sumPartitions(input: number, cooperative: Cooperative) {
	let count = 0
	for await (const p of partition(input, cooperative)) {
		if (p.length > 1) {
			count++
		}
	}
	return count
}
