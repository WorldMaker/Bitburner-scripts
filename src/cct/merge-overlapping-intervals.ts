/*
Merge Overlapping Intervals
You are attempting to solve a Coding Contract. You have 15 tries remaining, after which the contract will self-destruct.


Given the following array of arrays of numbers representing a list of intervals, merge all overlapping intervals.

[[23,32],[13,21],[11,21],[10,16],[9,13],[11,13],[3,5],[9,15],[14,24],[4,6]]

Example:

[[1, 3], [8, 10], [2, 6], [10, 16]]

would merge into [[1, 6], [8, 16]].

The intervals must be returned in ASCENDING order. You can assume that in an interval, the first number will always be smaller than the second.
*/

import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import {
	orderBy,
	thenBy,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'

export function mergeOverlappingIntervals(data: [number, number][]) {
	const sorted = [
		...IterableX.from(data).pipe(
			orderBy(([min]) => min),
			thenBy(([, max]) => max)
		),
	]
	if (sorted.length <= 1) {
		return sorted
	}
	const results: [number, number][] = []
	let [curmin, curmax] = sorted.shift()!
	while (sorted.length > 0) {
		const [min, max] = sorted.shift()!
		if (curmin <= min && min <= curmax) {
			curmax = Math.max(curmax, max)
		} else {
			results.push([curmin, curmax])
			curmin = min
			curmax = max
		}
	}
	results.push([curmin, curmax])

	return results
}
