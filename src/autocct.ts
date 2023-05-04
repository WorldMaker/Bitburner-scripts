import { NsLogger } from './logging/logger'
import { Config } from './models/config'
import { simpleTargetFactory } from './models/targets/simple-target'
import { CctService } from './services/cct'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

let running = false

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const [command] = ns.args

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

	const config = new Config(ns)
	config.load()
	const logger = new NsLogger(ns, runonce)
	const servers = new ServerCacheService(ns, simpleTargetFactory)
	const scannerService = new ScannerService(
		ns,
		config,
		servers,
		simpleTargetFactory
	)
	const cctService = new CctService(ns, config, servers, logger)

	let ran = false

	while ((runonce && !ran) || (!runonce && running)) {
		ran = true
		config.load()

		scannerService.scan()

		await cctService.manage(force, showSkippedResults)

		cctService.summarize()

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
