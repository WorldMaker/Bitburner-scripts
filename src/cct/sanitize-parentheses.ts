/*
Sanitize Parentheses in Expression
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Given the following string:

((a)(((a(a))a)

remove the minimum number of invalid parentheses in order to validate the string. If there are multiple minimal ways to validate the string, provide all of the possible results. The answer should be provided as an array of strings. If it is impossible to validate the string the result should be an array with only an empty string.

IMPORTANT: The string may contain letters, not just parentheses. Examples:
"()())()" -> [()()(), (())()]
"(a)())()" -> [(a)()(), (a())()]
")(" -> [""]
*/

import { Logger } from 'tslog'
import { TemplateLogger } from '../logging/template-logger'

interface ParenMap {
	open: Set<number>
	close: Set<number>
	closeBeforeOpen: Set<number>
	unclosed: number
	valid: boolean
}

function mapParentheses(input: string): ParenMap {
	const open = new Set<number>()
	const close = new Set<number>()
	let firstOpen: number | null = null
	const closeBeforeOpen = new Set<number>()
	let unclosed = 0
	let unbalanced = false
	for (let i = 0; i < input.length; i++) {
		const char = input.charAt(i)
		switch (char) {
			case '(':
				open.add(i)
				firstOpen ??= i
				if (unclosed < 0) {
					unbalanced = true
				}
				unclosed++
				break
			case ')':
				if (firstOpen == null) {
					closeBeforeOpen.add(i)
					break
				}
				close.add(i)
				unclosed--
				break
		}
	}
	return {
		open,
		close,
		closeBeforeOpen,
		unclosed,
		valid: !unbalanced && closeBeforeOpen.size === 0 && unclosed === 0,
	}
}

function* combos(
	source: Set<number>,
	chosen: Set<number>,
	choose: number
): Iterable<Set<number>> {
	if (choose > source.size) {
		throw new Error(`Can't choose ${choose} items from set of ${source.size}`)
	}

	if (choose <= 0) {
		yield chosen
		return
	}

	if (choose === 1) {
		for (const item of source) {
			const nextChosen = new Set(chosen)
			nextChosen.add(item)
			yield nextChosen
		}
		return
	}

	for (const item of source) {
		const nextSource = new Set(source)
		nextSource.delete(item)
		const nextChosen = new Set(chosen)
		nextChosen.add(item)

		for (const result of combos(nextSource, nextChosen, choose - 1)) {
			yield result
		}
	}
}

function cleanString(
	input: string,
	{ closeBeforeOpen }: ParenMap,
	remove: Set<number>
): string {
	let result = ''
	for (let i = 0; i < input.length; i++) {
		if (closeBeforeOpen.has(i) || remove.has(i)) {
			continue
		}
		result += input.charAt(i)
	}
	return result
}

export function sanitizeParentheses(
	input: string,
	baseLogger?: Logger<any>
): string[] {
	const logger = new TemplateLogger(
		baseLogger ?? new Logger({ type: 'hidden' })
	)

	if (input.length === 0) {
		return ['']
	}

	const map = mapParentheses(input)

	if (map.valid) {
		return [input]
	}

	if (map.unclosed === 0) {
		throw new Error(`Unbalanced parentheses in ${input}?`)
	}

	const results = new Set<string>()

	const toRemove = Math.abs(map.unclosed)
	const removeSet = map.unclosed > 0 ? map.open : map.close
	logger.debug`trying to remove ${toRemove} parens of ${removeSet.size}`

	if (toRemove > removeSet.size) {
		return ['']
	}
	for (const removals of combos(removeSet, new Set(), toRemove)) {
		const result = cleanString(input, map, removals)
		// triple check validity
		const { valid } = mapParentheses(result)
		if (valid) {
			results.add(result)
		}
	}

	if (results.size <= 0) {
		return ['']
	}

	return [...results].sort()
}
