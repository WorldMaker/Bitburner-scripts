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

import { sumCombinations } from './total-ways-to-sum2'

export function sumPartitions(input: number) {
	const possibilities = []
	for (let i = 1; i < input; i++) {
		possibilities.push(i)
	}
	return sumCombinations([input, possibilities])
}
