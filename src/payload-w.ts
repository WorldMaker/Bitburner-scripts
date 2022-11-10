let target: string = 'n00dles'
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
				break

			case 'target':
				target = ns.args[1]?.toString() ?? target
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
		await ns.weaken(target)
	}
}
