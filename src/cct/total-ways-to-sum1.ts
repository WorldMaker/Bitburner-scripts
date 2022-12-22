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

async function* partition(
	n: number,
	cooperative: () => Promise<any>,
	I = 1
): AsyncIterable<number[]> {
	yield [n]
	for (let i = I; i < Math.floor(n / 2) + 1; i++) {
		for await (const p of partition(n - i, cooperative, i)) {
			yield [i, ...p]
		}
	}
	await cooperative()
}

export async function sumPartitions(
	input: number,
	cooperative: () => Promise<any>
) {
	let count = 0
	for await (const p of partition(input, cooperative)) {
		if (p.length > 1) {
			count++
		}
	}
	return count
}
