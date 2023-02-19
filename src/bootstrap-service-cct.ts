import { NsLogger } from './logging/logger.js'
import { Config } from './models/config.js'
import { deployTargetFactory } from './models/targets/server-target'
import { AppCacheService } from './services/app-cache.js'
import { CctService } from './services/cct.js'
import { DeploymentService } from './services/deployment.js'
import { HackerService } from './services/hacker.js'
import { PayloadPlanningService } from './services/payload-planners/index.js'
import { PayloadService } from './services/payload.js'
import { PurchaseService } from './services/purchase.js'
import { ScannerService } from './services/scanner.js'
import { ServerCacheService } from './services/server-cache.js'
import { ServiceService } from './services/service.js'
import { TargetService } from './services/target.js'
import { ToyPurchaseService } from './services/toy-purchase/index.js'

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const config = new Config(ns)
	config.load()

	if (config.tail) {
		ns.tail()
	}

	const apps = new AppCacheService(ns)
	const logger = new NsLogger(ns)
	const manager = new ServiceService(ns, logger, config)
	const targetService = new TargetService()
	const payloadService = new PayloadService()
	const targetFactory = deployTargetFactory
	const servers = new ServerCacheService(ns, targetFactory)
	manager.register(new CctService(ns, servers, logger))
	const toyPurchaseService = new ToyPurchaseService(ns, logger, servers, 0)
	manager.register(
		new PurchaseService(
			ns,
			config,
			logger,
			servers,
			targetFactory,
			toyPurchaseService
		)
	)
	const payloadPlanner = new PayloadPlanningService(
		ns,
		config,
		targetService,
		apps,
		logger
	)
	const hackerService = new HackerService(ns, logger)
	const scannerService = new ScannerService(ns, config, servers, targetFactory)
	manager.useDeploymentService(
		new DeploymentService(
			hackerService,
			logger,
			payloadPlanner,
			payloadService,
			servers,
			scannerService,
			targetService
		)
	)

	const running = true
	while (running) {
		await manager.manage()

		manager.summarize()

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
