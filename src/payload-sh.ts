export async function main(ns: NS) {
	const command = ns.args[0].toString()
	if (command !== 'start') {
		throw new Error(`Unknown command for payload '${command}'`)
	}
	const target = ns.args[1].toString()
	await ns.hack(target)
}
