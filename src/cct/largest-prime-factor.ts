/*
Find Largest Prime Factor
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


A prime factor is a factor that is a prime number. What is the largest prime factor of 995480028?
*/

export function largestPrimeFactor(x: number): number {
	for (let i = 2; i < Math.sqrt(x) + 1; i++) {
		if (x % i === 0) {
			return largestPrimeFactor(Math.floor(x / i))
		}
	}
	return x
}

export async function main(ns: NS) {
	const x = Number(ns.args[0])
	const solution = largestPrimeFactor(x)
	ns.tprint(solution)
}
