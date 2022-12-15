/*
Array Jumping Game
You are attempting to solve a Coding Contract. You have 1 tries remaining, after which the contract will self-destruct.


You are given the following array of integers:

5,7,9,3,0,7

Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.

Assuming you are initially positioned at the start of the array, determine whether you are able to reach the last index.

Your answer should be submitted as 1 or 0, representing true and false respectively
*/

import { arrayJumpingGame2 } from './array-jumping-game2'

export function arrayJumpingGame1(data: number[]) {
	const jumps = arrayJumpingGame2(data)
	return jumps > 0 ? 1 : 0
}
