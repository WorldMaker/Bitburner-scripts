let target = 'n00dles'
let securityThreshold = 0
let moneyThreshold = 0
let running = false

export async function main(ns: NS) {
	const command = ns.args[0]?.toString()
	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				target = ns.args[1]?.toString() ?? target
				securityThreshold = Number(ns.args[2]) ?? securityThreshold
				moneyThreshold = Number(ns.args[3]) ?? moneyThreshold
				break

			case 'target':
				target = ns.args[1]?.toString() ?? target
				securityThreshold = Number(ns.args[2]) ?? securityThreshold
				moneyThreshold = Number(ns.args[3]) ?? moneyThreshold
				break

			default:
				ns.print(`WARN Unknown command ${command}`)
				break
		}
	}

	if (running) {
		return
	}

	running = true

	while (running) {
		if (
			ns.getServerSecurityLevel(target) <= securityThreshold &&
			ns.getServerMoneyAvailable(target) >= moneyThreshold
		) {
			await ns.hack(target)
			await ns.sleep(Math.random() /* 0-1s */ * 1000 /* ms */ + 20 /* ms */) // ~20ms to 1s 20ms
		} else {
			await ns.sleep(1000 /* ms */)
		}
	}
}
