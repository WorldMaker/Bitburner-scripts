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

import { Cooperative } from '.'

async function countPartitions(
	n: number,
	cooperative: Cooperative,
	I = 1
): Promise<number> {
	let count = 1 // [n]
	for (let i = I; i < Math.floor(n / 2) + 1; i++) {
		count += await countPartitions(n - i, cooperative, i) // [i, ...p]
	}
	await cooperative(() => `partioning ${n}; ${I}`)
	return count
}

export async function sumPartitions(input: number, cooperative: Cooperative) {
	const count = await countPartitions(input, cooperative)
	return count - 1 // p.length > 1 => - 1 // remove the partition of just [n] where n = input
}
