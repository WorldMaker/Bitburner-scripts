import { NsLogger } from './logging/logger.js'
import { PlayerStats } from './models/stats.js'
import { deployTargetFactory } from './models/target.js'
import { AppCacheService } from './services/app-cache.js'
import { DeploymentService } from './services/deployment.js'
import { HackerService } from './services/hacker.js'
import { PayloadPlanningService } from './services/payload-planners/index.js'
import { PayloadService } from './services/payload.js'
import { PurchaseService } from './services/purchase.js'
import { ScannerService } from './services/scanner.js'
import { ServerCacheService } from './services/server-cache.js'
import { TargetService } from './services/target.js'
import { ToyPurchaseService } from './services/toy-purchase.js'

let running = false
let strategy = 'multiup'
let forceMaxDepth: number | null = null

export async function main(ns: NS) {
	const command = ns.args[0]?.toString()
	let hacknetNodes = 5

	ns.disableLog('scp')
	ns.disableLog('kill')
	ns.disableLog('exec')

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				strategy = ns.args[1]?.toString() ?? strategy
				hacknetNodes = Number(ns.args[2]) || hacknetNodes
				ns.tail()
				break

			case 'maxdepth':
				forceMaxDepth = Number(ns.args[1]) || null
				break

			case 'strategy':
				strategy = ns.args[1].toString()
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
	const logger = new NsLogger(ns)
	const targetService = new TargetService()
	const payloadService = new PayloadService()
	const targetFactory = deployTargetFactory
	const servers = new ServerCacheService(ns, targetFactory)
	const purchaseService = new PurchaseService(ns, servers, hacknetNodes)
	const toyPurchaseService = new ToyPurchaseService(ns, logger, servers, 0)
	const payloadPlanner = new PayloadPlanningService(
		ns,
		targetService,
		apps,
		logger
	)
	const hackerService = new HackerService(ns, logger)
	const scannerService = new ScannerService(
		ns,
		servers,
		targetFactory,
		forceMaxDepth
	)
	const deploymentService = new DeploymentService(
		hackerService,
		logger,
		payloadPlanner,
		payloadService,
		scannerService,
		targetService
	)

	while (running) {
		// *** hacking and deploying payloads ***
		const stats = new PlayerStats(ns)
		deploymentService.deploy(stats, strategy, forceMaxDepth)

		// *** purchasing servers ***
		if (purchaseService.wantsToPurchase()) {
			purchaseService.purchase()
			if (!purchaseService.wantsToPurchase()) {
				logger.hooray`Finished purchasing`
			}
		}

		toyPurchaseService.purchase()

		// *** status logging ***
		logger.log(toyPurchaseService.summarize())
		logger.log(purchaseService.summarize())
		deploymentService.summarize(stats)

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
