import { NsLogger } from './logging/logger'
import { TargetContext } from './models/context'
import { simpleTargetFactory } from './models/targets/simple-target'
import { CctService } from './services/cct'
import { ScannerService } from './services/scanner'

let running = false

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const [command, isolateType] = ns.args

	let force = false

	let runonce = false
	let showSkippedResults = false

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				ns.tail()
				break

			case 'force':
				runonce = true
				force = true
				break

			case 'run':
				runonce = true
				showSkippedResults = true
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
	const context = new TargetContext(ns, logger, simpleTargetFactory)
	context.load()
	const scannerService = new ScannerService(context)
	const cctService = new CctService(context)

	let ran = false

	while ((runonce && !ran) || (!runonce && running)) {
		ran = true
		context.load()

		scannerService.scan()

		await cctService.manage(
			force,
			showSkippedResults,
			runonce,
			isolateType?.toString()
		)

		cctService.summarize(true)

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
