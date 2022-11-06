let target: string = 'n00dles'
let securityThreshold = 0
let isRunning = false

export async function main(ns: NS) {
	const command = ns.args[0]?.toString()
	if (command) {
		switch (command) {
			case 'stop':
				isRunning = false
				return

			case 'start':
				isRunning = false
				target = ns.args[1]?.toString() ?? target
				securityThreshold = Number(ns.args[2]) ?? securityThreshold
				break

			case 'target':
				target = ns.args[1]?.toString() ?? target
				securityThreshold = Number(ns.args[2]) ?? securityThreshold
				break

			default:
				ns.print(`WARN Unknown command ${command}`)
				break
		}
	}

	if (isRunning) {
		return
	}

	isRunning = true

	while (isRunning) {
		if (ns.getServerSecurityLevel(target) <= securityThreshold) {
			await ns.grow(target)
		} else {
			await ns.sleep(1000 /* ms */)
		}
	}
}
