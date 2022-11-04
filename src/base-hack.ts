const moneyThresholdMultiplier = 0.75
const securityThresholdOverage = 5
const currentTargetActions = 10

let nextTarget: string = 'n00dles'

export async function main(ns: NS) {
	nextTarget = ns.args[0]?.toString() ?? nextTarget
	let target = nextTarget
	while (true) {
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
