/*
Generate IP Addresses
You are attempting to solve a Coding Contract. You have 9 tries remaining, after which the contract will self-destruct.


Given the following string containing only digits, return an array with all possible valid IP address combinations that can be created from the string:

2228490113

Note that an octet cannot begin with a '0' unless the number itself is actually 0. For example, '192.168.010.1' is not a valid IP.

Examples:

25525511135 -> [255.255.11.135, 255.255.111.35]
1938718066 -> [193.87.180.66]
*/

const example = '2228490113'

export function generateIps(
	results: string[],
	input: number[],
	ip = '',
	position = 0,
	quads = 0,
	currentQuad = 0,
	lastDigit: number | null = null
) {
	if (quads > 3) {
		return
	}

	if (currentQuad >= 256) {
		return
	}

	if (position === input.length) {
		results.push(ip)
		return
	}

	// concatenate if not leading zero
	if (!(currentQuad === 0 && lastDigit === 0)) {
		const updatedQuad = currentQuad * 10 + input[position]
		if (updatedQuad < 256) {
			generateIps(
				results,
				input,
				`${ip}${input[position]}`,
				position + 1,
				quads,
				updatedQuad,
				input[position]
			)
		}
	}

	// start new dotted quad
	if (position > 0 && quads < 3) {
		generateIps(
			results,
			input,
			`${ip}.${input[position]}`,
			position + 1,
			quads + 1,
			input[position],
			input[position]
		)
	}
}

export function solveGenerateIps(data: string) {
	const results: string[] = []
	const input = data.split('').map((d) => parseInt(d, 10))
	generateIps(results, input)
	return `[${results.join(', ')}]`
}

export async function main(ns: NS) {
	const input = ns.args[0]
		.toString()
		.split('')
		.map((digit) => parseInt(digit, 10))
	const results: string[] = []
	generateIps(results, input)
	ns.tprint(`[${results.join(', ')}]`)
}

console.log(solveGenerateIps(example))
