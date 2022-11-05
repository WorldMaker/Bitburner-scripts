const moneyThresholdMultiplier = 0.75
const securityThresholdOverage = 5
const currentTargetActions = 10

let nextTarget: string = 'n00dles'
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
				nextTarget = ns.args[1]?.toString() ?? nextTarget
				break

			case 'target':
				nextTarget = ns.args[1]?.toString() ?? nextTarget
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

	let target = nextTarget
	while (isRunning) {
		const moneyThreshold =
			ns.getServerMaxMoney(target) * moneyThresholdMultiplier
		const securityThreshold =
			ns.getServerMinSecurityLevel(target) + securityThresholdOverage

		let hacked = false
		let action = 0

		while (
			target === nextTarget &&
			(action < currentTargetActions || !hacked)
		) {
			if (ns.getServerSecurityLevel(target) > securityThreshold) {
				await ns.weaken(target)
			} else if (ns.getServerMoneyAvailable(target) < moneyThreshold) {
				await ns.grow(target)
			} else {
				await ns.hack(target)
				hacked = true
			}
			action++
		}

		target = nextTarget
	}
}
