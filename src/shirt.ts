import { NsLogger } from './logging/logger'
import { ShirtService } from './services/shirt'

let running = false

export async function main(ns: NS) {
	const [command] = ns.args

	let runonce = false

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				ns.tail()
				break

			case 'run':
				runonce = true
				break

			default:
				ns.tprint(`WARN Unknown command ${command}`)
				break
		}
	}

	if (!runonce) {
		if (running) {
			return
		}

		running = true
	}

	const logger = new NsLogger(ns, runonce)
	const shirtService = new ShirtService(ns)

	let ran = false

	while ((runonce && !ran) || (!runonce && running)) {
		ran = true

		shirtService.manage()

		logger.log(shirtService.summarize())

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
