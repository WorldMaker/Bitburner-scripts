/*
HammingCodes: Integer to Encoded Binary
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following decimal Value:
1755
Convert it to a binary representation and encode it as an 'extended Hamming code'. Eg:
Value 8 is expressed in binary as '1000', which will be encoded with the pattern 'pppdpddd', where p is a parity bit and d a data bit,
or '10101' (Value 21) will result into (pppdpdddpd) '1001101011'.
The answer should be given as a string containing only 1s and 0s.
NOTE: the endianness of the data bits is reversed in relation to the endianness of the parity bits.
NOTE: The bit at index zero is the overall parity bit, this should be set last.
NOTE 2: You should watch the Hamming Code video from 3Blue1Brown, which explains the 'rule' of encoding, including the first index parity bit mentioned in the previous note.

Extra rule for encoding:
There should be no leading zeros in the 'data bit' section
*/

/*
10011

10101
*/

function isPowerOf2(n: number) {
	return Math.log2(n) % 1 === 0
}

function parityLength(numBits: number) {
	if (numBits <= 1) {
		return 2
	} else if (numBits <= 4) {
		return 3
	} else if (numBits <= 11) {
		return 4
	} else if (numBits <= 26) {
		return 5
	} else if (numBits <= 57) {
		return 6
	} else if (numBits <= 120) {
		return 7
	} else if (numBits <= 247) {
		return 8
	} else {
		return Math.ceil(Math.log2(numBits + 1))
	}
}

export function encodeHamming(n: number) {
	// doing this all stringy because JS, why not
	const data = n.toString(2)
	console.log(data)
	let parityBits = 0
	let parity = 0
	for (let i = 0; i < data.length; i++) {
		if (data.charAt(data.length - i - 1) === '1') {
			parityBits = parityBits ^ i
			parity = parity ^ 1
		}
	}

	const bitsBinary = parityBits.toString(2)
	for (let i = 0; i < bitsBinary.length; i++) {
		if (bitsBinary.charAt(i) === '1') {
			parity = parity ^ 1
		}
	}
	console.log(bitsBinary)
	console.log(parity)

	let hamming = parity.toString()
	let dataPosition = 0
	const parityCount = parityLength(data.length)
	console.log(parityCount)
	let bitsPosition = 0
	console.log(bitsPosition)
	for (let i = 1; i < parityCount + data.length + 1; i++) {
		if (isPowerOf2(i)) {
			if (bitsPosition < bitsBinary.length) {
				hamming += bitsBinary.charAt(bitsPosition)
				bitsPosition++
			} else {
				hamming += '0'
				bitsPosition++
			}
		} else {
			hamming += data.charAt(dataPosition)
			dataPosition++
		}
	}
	return hamming
}
