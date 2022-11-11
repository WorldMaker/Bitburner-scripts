import { Logger } from './models/logger.js'
import { PlayerStats } from './models/stats.js'
import { LazyTarget } from './models/target.js'
import { AppCacheService, PayloadAll } from './services/app-cache.js'
import { DeploymentService } from './services/deployment.js'
import { HackerService } from './services/hacker.js'
import { MultiTargetDirectionalFormulatedPlanner } from './services/payload-planners/multi-target-directional-formulated.js'
import { MultiTargetDirectionalRoundRobinPlanner } from './services/payload-planners/multi-target-directional-round-robin.js'
import { MultiTargetRoundRobinPlanner } from './services/payload-planners/multi-target-round-robin.js'
import { MultiTargetUpgradePlanner } from './services/payload-planners/multi-target-upgrade.js'
import { SingleTargetDirectionalPayloadPlanner } from './services/payload-planners/single-target-directional-payload.js'
import { SingleTargetSinglePayloadPlanner } from './services/payload-planners/single-target-single-payload.js'
import { PayloadService } from './services/payload.js'
import { PurchaseService } from './services/purchase.js'
import { ScannerService } from './services/scanner.js'
import { ServerCacheService } from './services/server-cache.js'
import { TargetService } from './services/target.js'
import { ToyPurchaseService } from './services/toy-purchase.js'

let running = false
let strategy = 'multiup'

export async function main(ns: NS) {
	const command = ns.args[0]?.toString()
	let hacknetNodes = 5
	let suggestedTarget = new LazyTarget(ns, 'n00dles', false)

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				strategy = ns.args[1]?.toString() ?? strategy
				hacknetNodes = Number(ns.args[2]) || hacknetNodes
				suggestedTarget = new LazyTarget(
					ns,
					ns.args[3]?.toString() ?? 'n00dles',
					false
				)
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
	const logger = new Logger(ns)
	const targetService = new TargetService(suggestedTarget)
	const payloadService = new PayloadService()
	const servers = new ServerCacheService(ns)
	const purchaseService = new PurchaseService(ns, servers, hacknetNodes)
	const toyPurchaseService = new ToyPurchaseService(ns, logger, servers, 0)

	let lastServersCount = 0
	let lastRootedCount = 0
	let lastPayloadsCount = 0

	const getPayloadPlanner = () => {
		switch (strategy) {
			case 'simple':
				return new SingleTargetSinglePayloadPlanner(
					logger,
					targetService,
					apps.getApp(PayloadAll)
				)
			case 'multisimple':
				return new MultiTargetRoundRobinPlanner(
					logger,
					targetService,
					apps.getApp(PayloadAll)
				)
			case 'multidirectional':
				return new MultiTargetDirectionalRoundRobinPlanner(
					logger,
					targetService,
					apps
				)
			case 'formulated':
				return new MultiTargetDirectionalFormulatedPlanner(
					ns,
					targetService,
					apps
				)
			case 'multiup':
				return new MultiTargetUpgradePlanner(ns, logger, targetService, apps)
			case 'directional':
			default:
				return new SingleTargetDirectionalPayloadPlanner(
					logger,
					targetService,
					apps
				)
		}
	}

	let payloadPlanner = getPayloadPlanner()

	while (running) {
		payloadPlanner = getPayloadPlanner()

		// *** hacking and deploying payloads ***
		const stats = new PlayerStats(ns)
		const hackerService = new HackerService(ns, logger, stats)
		const scannerService = new ScannerService(ns, servers)
		const deploymentService = new DeploymentService(
			hackerService,
			logger,
			payloadPlanner,
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

		toyPurchaseService.purchase()

		// *** status logging ***
		logger.log(toyPurchaseService.summarize())
		logger.log(purchaseService.summarize())
		logger.log(payloadPlanner.summarize())
		logger.log(
			`INFO ${counts.plans} deployment plans; ${counts.existingPlans} existing, ${counts.changedPlans} changed`
		)
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
