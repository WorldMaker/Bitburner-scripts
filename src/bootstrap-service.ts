import { Server } from './models/server.js'
import { DeploymentService } from './services/deployment.js'
import { HackerService } from './services/hacker.js'
import { MultiPayloadService } from './services/payload.js'
import { PurchaseService } from './services/purchase.js'
import { ScannerService } from './services/scanner.js'
import { ServerCacheService } from './services/server-cache.js'
import { Stats } from './models/stats.js'
import { TargetService } from './services/target.js'
import { Logger } from './models/logger.js'
import { AppCacheService } from './services/app-cache.js'

let running = false
let maxDepth = 3

export async function main(ns: NS) {
	const command = ns.args[0]?.toString()
	let hacknetNodes = 5
	let suggestedTarget = new Server(ns, 'n00dles')

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				maxDepth = Number(ns.args[1]) ?? maxDepth
				hacknetNodes = Number(ns.args[2]) || hacknetNodes
				suggestedTarget = new Server(ns, ns.args[4]?.toString() ?? 'n00dles')
				break

			case 'maxdepth':
				maxDepth = Number(ns.args[1]) ?? maxDepth
				break

			default:
				ns.tprint(`WARN Unknown command ${command}`)
				break
		}
	}

	if (running) {
		return
	}

	running = true

	const apps = new AppCacheService(ns)
	const logger = new Logger(ns)
	const targetService = new TargetService(suggestedTarget)
	const payloadService = new MultiPayloadService(logger, targetService, apps)
	const servers = new ServerCacheService(ns)
	const purchaseService = new PurchaseService(
		ns,
		payloadService,
		servers,
		targetService,
		hacknetNodes
	)

	let lastServersCount = 0
	let lastRootedCount = 0
	let lastPayloadsCount = 0

	while (running) {
		// *** hacking and deploying payloads ***
		const stats = new Stats(ns)
		const hackerService = new HackerService(ns, logger, stats)
		const scannerService = new ScannerService(ns, servers, maxDepth)
		const deploymentService = new DeploymentService(
			hackerService,
			logger,
			payloadService,
			scannerService,
			stats,
			targetService
		)
		const counts = deploymentService.deploy()

		// *** purchasing servers ***
		if (purchaseService.wantsToPurchase()) {
			purchaseService.purchase()
			if (!purchaseService.wantsToPurchase()) {
				logger.display('SUCCESS Finished purchasing')
			}
		}

		// *** status logging ***
		const statusMessage = `INFO ${counts.servers} servers scanned; ${counts.rooted} rooted, ${counts.payloads} payloads`
		// terminal notifications when changes occur otherwise regular logs
		if (
			counts.servers !== lastServersCount ||
			counts.rooted !== lastRootedCount ||
			counts.payloads !== lastPayloadsCount
		) {
			logger.display(statusMessage)
			lastServersCount = counts.servers
			lastRootedCount = counts.rooted
			lastPayloadsCount = counts.payloads
		} else {
			logger.log(statusMessage)
		}

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
