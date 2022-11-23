export async function payload<T>(
	ns: NS,
	operation: (target: string) => Promise<T>
) {
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

	await operation(target)

	const end = new Date(
		typeof ns.args[3] !== 'boolean' ? ns.args[3] : new Date()
	)
	const endTime = end.getTime()
	const now2 = performance.now()
	if (endTime > now) {
		const sleepTime = endTime - now2
		if (sleepTime >= 20 /* ms */) {
			await ns.sleep(sleepTime)
		}
	}
}
