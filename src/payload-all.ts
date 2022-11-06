import { BaseServer } from './models/server'
import { findTargetDirection, TargetDirection } from './models/target'

const currentTargetActions = 10

let nextTarget: string = 'n00dles'
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

	let target = new BaseServer(ns, nextTarget)
	let direction: TargetDirection = 'weaken'
	while (running) {
		let hacked = false
		let action = 0

		while (
			target.name === nextTarget &&
			(action < currentTargetActions || !hacked)
		) {
			direction = findTargetDirection(target, direction)
			switch (direction) {
				case 'weaken':
					await ns.weaken(target.name)
				case 'grow':
					await ns.grow(target.name)
				case 'hack':
					await ns.hack(target.name)
					hacked = true
				default:
					await ns.sleep(1 /* s */ * 1000 /* ms */)
			}
			action++
		}

		target = new BaseServer(ns, nextTarget)
	}
}
