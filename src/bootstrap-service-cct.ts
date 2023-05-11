import { NsLogger } from './logging/logger.js'
import { TargetContext } from './models/context.js'
import { deployTargetFactory } from './models/targets/server-target'
import { AppCacheService } from './services/app-cache.js'
import { CctService } from './services/cct.js'
import { DeploymentService } from './services/deployment.js'
import { HackerService } from './services/hacker.js'
import { HacknetHashService } from './services/hacknet.js'
import { PayloadPlanningService } from './services/payload-planners/index.js'
import { PayloadService } from './services/payload.js'
import { PurchaseService } from './services/purchase.js'
import { ScannerService } from './services/scanner.js'
import { ServiceService } from './services/service.js'
import { TargetService } from './services/target.js'
import { ToyPurchaseService } from './services/toy-purchase/index.js'

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const logger = new NsLogger(ns)
	const context = new TargetContext(ns, logger, deployTargetFactory)
	context.load()

	if (context.tail) {
		ns.tail()
	}

	const apps = new AppCacheService(ns)
	const manager = new ServiceService(context)
	const targetService = new TargetService()
	const payloadService = new PayloadService()
	manager.register(new CctService(context))
	const toyPurchaseService = new ToyPurchaseService(context)
	const hacknetHashService = new HacknetHashService(context)
	manager.register(
		new PurchaseService(context, toyPurchaseService),
		hacknetHashService
	)
	toyPurchaseService.register(hacknetHashService)
	const payloadPlanner = new PayloadPlanningService(
		context,
		targetService,
		apps
	)
	const hackerService = new HackerService(context)
	const scannerService = new ScannerService(context)
	manager.useDeploymentService(
		new DeploymentService(
			context,
			hackerService,
			payloadPlanner,
			payloadService,
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
