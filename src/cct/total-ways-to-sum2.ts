/*
Total Ways to Sum II
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


How many different distinct ways can the number 82 be written as a sum of integers contained in the set:

[2,3,4,5,7,8,9,10,14,15,16]?

You may use each integer in the set zero or more times.
*/

export type SumInput = [number, number[]]

function sumCombination(
	target: number,
	sum: number,
	inputs: number[],
	combo: number[],
	current = 0
): number {
	if (sum === target) {
		return 1
	}

	if (sum > target) {
		return 0
	}

	if (!inputs.length) {
		return 0
	}

	if (current >= inputs.length) {
		return 0
	}

	let found = 0
	let i = 0
	let nextSum = sum
	const baseInput = inputs[current]
	while (nextSum <= target) {
		if (nextSum === target) {
			found++
			break
		}
		const nextCombo = [...combo]
		nextCombo[current] = i

		found += sumCombination(target, nextSum, inputs, nextCombo, current + 1)

		i++
		nextSum = sum + i * baseInput
	}
	return found
}

export function sumCombinations(data: SumInput) {
	const [target, inputs] = data
	inputs.sort()
	const combo = new Array(inputs.length).fill(0)
	return sumCombination(target, 0, inputs, combo)
}
