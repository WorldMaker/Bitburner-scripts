/*
Find All Valid Math Expressions
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following string which contains only digits between 0 and 9:

6323557575

You are also given a target number of -13. Return all possible ways you can add the +(add), -(subtract), and *(multiply) operators to the string such that it evaluates to the target number. (Normal order of operations applies.)

The provided answer should be an array of strings containing the valid expressions. The data provided by this problem is an array with two elements. The first element is the string of digits, while the second element is the target number:

["6323557575", -13]

NOTE: The order of evaluation expects script operator precedence NOTE: Numbers in the expression cannot have leading 0's. In other words, "1+01" is not a valid expression Examples:

Input: digits = "123", target = 6
Output: [1+2+3, 1*2*3]

Input: digits = "105", target = 5
Output: [1*0+5, 10-5]
*/

import { AsyncIterableX } from '@reactivex/ix-esnext-esm/asynciterable/asynciterablex'
import { filter } from '@reactivex/ix-esnext-esm/asynciterable/operators/filter'
import { orderBy } from '@reactivex/ix-esnext-esm/asynciterable/operators/orderby'
import { map } from '@reactivex/ix-esnext-esm/asynciterable/operators/map'
import { toArray } from '@reactivex/ix-esnext-esm/asynciterable/toarray'

export type MathExpressionInput = [string, number]

const NotLeadingZeroRegex = /0[\+\*\-]/

async function* generatePossibleSolutions(
	input: number[],
	cooperative: (summarize: () => string) => Promise<any>,
	position = 0
): AsyncIterable<string> {
	if (position >= input.length) {
		return
	}

	const digit = input[position]
	// double digit lookahead
	const nextDigit = position + 1 < input.length ? input[position + 1] : null
	const digitAfter = position + 2 < input.length ? input[position + 2] : null

	// *** hand unroll final trigraphs ***

	if (nextDigit === null) {
		yield digit.toString()
		return
	}

	if (digitAfter === null) {
		yield `${digit}${nextDigit}`
		yield `${digit}+${nextDigit}`
		yield `${digit}-${nextDigit}`
		yield `${digit}*${nextDigit}`
		return
	}

	if (position + 2 === input.length - 1) {
		yield `${digit}${nextDigit}${digitAfter}`
		yield `${digit}${nextDigit}+${digitAfter}`
		yield `${digit}${nextDigit}-${digitAfter}`
		yield `${digit}${nextDigit}*${digitAfter}`
		if (nextDigit !== 0) {
			yield `${digit}+${nextDigit}${digitAfter}`
		}
		yield `${digit}+${nextDigit}+${digitAfter}`
		yield `${digit}+${nextDigit}-${digitAfter}`
		yield `${digit}+${nextDigit}*${digitAfter}`
		if (nextDigit !== 0) {
			yield `${digit}-${nextDigit}${digitAfter}`
		}
		yield `${digit}-${nextDigit}+${digitAfter}`
		yield `${digit}-${nextDigit}-${digitAfter}`
		yield `${digit}-${nextDigit}*${digitAfter}`
		if (nextDigit !== 0) {
			yield `${digit}*${nextDigit}${digitAfter}`
		}
		yield `${digit}*${nextDigit}+${digitAfter}`
		yield `${digit}*${nextDigit}-${digitAfter}`
		yield `${digit}*${nextDigit}*${digitAfter}`
		return
	}

	for await (const solution of generatePossibleSolutions(
		input,
		cooperative,
		position + 2
	)) {
		const notLeadingZero = NotLeadingZeroRegex.test(solution)
		yield `${digit}${nextDigit}${solution}`
		if (digitAfter !== 0 || notLeadingZero) {
			yield `${digit}${nextDigit}+${solution}`
			yield `${digit}${nextDigit}-${solution}`
			yield `${digit}${nextDigit}*${solution}`
		}
		if (nextDigit !== 0) {
			yield `${digit}+${nextDigit}${solution}`
		}
		if (digitAfter !== 0 || notLeadingZero) {
			yield `${digit}+${nextDigit}+${solution}`
			yield `${digit}+${nextDigit}-${solution}`
			yield `${digit}+${nextDigit}*${solution}`
		}
		if (nextDigit !== 0) {
			yield `${digit}-${nextDigit}${solution}`
		}
		if (digitAfter !== 0 || notLeadingZero) {
			yield `${digit}-${nextDigit}+${solution}`
			yield `${digit}-${nextDigit}-${solution}`
			yield `${digit}-${nextDigit}*${solution}`
		}
		if (nextDigit !== 0) {
			yield `${digit}*${nextDigit}${solution}`
		}
		if (digitAfter !== 0 || notLeadingZero) {
			yield `${digit}*${nextDigit}+${solution}`
			yield `${digit}*${nextDigit}-${solution}`
			yield `${digit}*${nextDigit}*${solution}`
		}
	}
	await cooperative(
		() =>
			`generating combos of valid math expressions; position ${position}/${input.length}`
	)
}

async function solve(
	input: number[],
	target: number,
	cooperative: (summarize: () => string) => Promise<void>
) {
	const solutions = AsyncIterableX.from(
		generatePossibleSolutions(input, cooperative)
	).pipe(
		// "script precedence", so use eval() as simple, relative fast solution validator
		filter((possibleSolution) => eval(possibleSolution) === target),
		map(async (solution, index) => {
			await cooperative(
				() => `testing for valid math expressions; found ${index}`
			)
			return solution
		}),
		orderBy((solution) => solution)
	)
	return await toArray(solutions)
}

export async function validMathExpressions(
	text: string,
	target: number,
	cooperative: (summarize: () => string) => Promise<any>
) {
	const input = text.split('').map((d) => parseInt(d, 10))
	return await solve(input, target, cooperative)
}

export async function solveValidMathExpressions(
	data: MathExpressionInput,
	cooperative: (summarize: () => string) => Promise<any>
) {
	const [text, target] = data
	const results = await validMathExpressions(text, target, cooperative)
	return results
}

export async function main(ns: NS) {
	const [text, target] = ns.args
	if (typeof target !== 'number') {
		return
	}
	const results = await validMathExpressions(
		text.toString(),
		target,
		async () => await ns.sleep(20 /* ms */)
	)
	ns.tprint(`[${results.join(', ')}]`)
}
