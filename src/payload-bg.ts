export async function main(ns: NS) {
	const command = ns.args[0].toString()
	if (command !== 'batch') {
		throw new Error(`Unknown command for payload '${command}'`)
	}
	const target = ns.args[1].toString()
	const start = new Date(
		typeof ns.args[2] !== 'boolean' ? ns.args[2] : new Date()
	)
	const startTime = start.getTime()
	const now = performance.now()
	if (startTime < now) {
		ns.tprint(`WARN late script execute: ${target} at ${start}`)
		return
	} else if (startTime > now) {
		const sleepTime = startTime - now
		if (sleepTime >= 20 /* ms */) {
			await ns.sleep(sleepTime)
		}
	}
	await ns.grow(target)
}
