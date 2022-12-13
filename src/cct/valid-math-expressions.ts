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

// const example = ['6323557575', -13] as const
// const example = ['68544196', -29] as const
const example = ['4412771994', -70] as const

function solve(
	results: string[],
	input: number[],
	target: number,
	position = 0,
	expression = '',
	lastDigit: number | null = null
) {
	if (position === input.length) {
		// assuming script precedence, so just use eval to check
		const evaluated = eval(expression)

		if (evaluated === target) {
			results.push(expression)
		}
		return
	}

	// concatenate (if not a leading zero)
	if (lastDigit !== 0) {
		solve(
			results,
			input,
			target,
			position + 1,
			`${expression}${input[position]}`,
			input[position]
		)
	}

	if (expression.length === 0) {
		// no leading operators
		return
	}

	// add
	solve(
		results,
		input,
		target,
		position + 1,
		`${expression}+${input[position]}`,
		input[position]
	)
	// subtract
	solve(
		results,
		input,
		target,
		position + 1,
		`${expression}-${input[position]}`,
		input[position]
	)
	// multiply
	solve(
		results,
		input,
		target,
		position + 1,
		`${expression}*${input[position]}`,
		input[position]
	)
}

export function validMathExpressions(text: string, target: number) {
	const input = text.split('').map((d) => parseInt(d, 10))
	const results: string[] = []
	solve(results, input, target)
	const sorted = results.sort()
	return sorted
}

export async function main(ns: NS) {
	const [text, target] = ns.args
	if (typeof target !== 'number') {
		return
	}
	const results = validMathExpressions(text.toString(), target)
	ns.tprint(JSON.stringify(results))
}

console.log(validMathExpressions('123', 6))
console.log(validMathExpressions('105', 5))

const results = validMathExpressions(example[0], example[1])
console.log(results)
console.log(`[${results.join(', ')}]`)
