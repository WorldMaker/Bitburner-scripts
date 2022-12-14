/*
Encryption I: Caesar Cipher
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Caesar cipher is one of the simplest encryption technique. It is a type of substitution cipher in which each letter in the plaintext is replaced by a letter some fixed number of positions down the alphabet. For example, with a left shift of 3, D would be replaced by A, E would become B, and A would become X (because of rotation).

You are given an array with two elements:
  ["FLASH TRASH ARRAY LOGIC EMAIL", 3]
The first element is the plaintext, the second element is the left shift value.

Return the ciphertext as uppercase string. Spaces remains the same.
*/

export function mod(n: number, m: number) {
	return ((n % m) + m) % m
}

export function enc1caeser(encoded: [string, number]): string {
	let decoded = ''
	const [text, leftShift] = encoded
	for (let i = 0; i < text.length; i++) {
		if (text.charAt(i) === ' ') {
			decoded += text.charAt(i)
			continue
		}
		// assume uppercase ASCII
		const value = text.charCodeAt(i) - 'A'.charCodeAt(0)
		const shiftedValue = mod(value - leftShift, 26)
		const decodedValue = String.fromCharCode(shiftedValue + 'A'.charCodeAt(0))
		decoded += decodedValue
	}
	return decoded
}

export async function main(ns: NS) {
	const [leftShift, ...text] = ns.args
	if (typeof leftShift !== 'number') {
		throw new Error('Expected left shift to be a number')
	}
	const decoded = enc1caeser([
		text.map((t) => t.toString()).join(' '),
		leftShift,
	])
	ns.tprint(decoded)
}
