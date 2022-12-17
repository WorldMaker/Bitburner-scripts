/*
HammingCodes: Encoded Binary to Integer
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following encoded binary string:
'1110100000011000'

Treat it as an extended Hamming code with 1 'possible' error at a random index.
Find the 'possible' wrong bit, fix it and extract the decimal value, which is hidden inside the string.

Note: The length of the binary string is dynamic, but it's encoding/decoding follows Hamming's 'rule'
Note 2: Index 0 is an 'overall' parity bit. Watch the Hamming code video from 3Blue1Brown for more information
Note 3: There's a ~55% chance for an altered Bit. So... MAYBE there is an altered Bit 😉
Note: The endianness of the encoded decimal value is reversed in relation to the endianness of the Hamming code. Where the Hamming code is expressed as little-endian (LSB at index 0), the decimal value encoded in it is expressed as big-endian (MSB at index 0).
Extra note for automation: return the decimal value as a string
*/

import { isPowerOf2 } from './hamming-encode'

export function decodeHamming(data: string) {
	let parity = 0
	let checkbits = 0

	let bits = [...data]

	for (let i = 0; i < bits.length; i++) {
		parity = bits[i] === '1' ? parity ^ 1 : parity ^ 0
		if (i > 0 && data[i] === '1') {
			checkbits = checkbits ^ i
		}
	}

	// *** try to correct a single error ***
	if (checkbits > 0) {
		// try to flip a single error
		bits[checkbits] = bits[checkbits] === '1' ? '0' : '1'
		const parityCheck = parity ^ (bits[checkbits] === '1' ? 1 : 0)
		if (parityCheck !== 0) {
			// may have been a double error
			return ''
		}
	}

	let result: string[] = []
	for (let i = 3; i < bits.length; i++) {
		if (!isPowerOf2(i)) {
			result.push(bits[i])
		}
	}

	return parseInt(result.join(''), 2).toString()
}
