let target: string = 'n00dles'
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
				break

			case 'target':
				target = ns.args[1]?.toString() ?? target
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
		await ns.weaken(target)
	}
}
