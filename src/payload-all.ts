import { SimpleTarget } from './models/targets/simple-target'

const currentTargetActions = 10

let nextTarget = 'n00dles'
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

	if (running) {
		return
	}

	running = true

	let target = new SimpleTarget(ns, nextTarget)
	while (running) {
		let hacked = false
		let action = 0

		while (
			target.name === nextTarget &&
			(action < currentTargetActions || !hacked)
		) {
			target.updateTargetDirection()
			switch (target.getTargetDirection()) {
				case 'weaken':
					await ns.weaken(target.name)
					action++
					break
				case 'grow':
					await ns.grow(target.name)
					action++
					break
				case 'hack':
					await ns.hack(target.name)
					action++
					hacked = true
					break
				default:
					await ns.sleep(1 /* s */ * 1000 /* ms */)
					break
			}
		}

		target = new SimpleTarget(ns, nextTarget)
	}
}
