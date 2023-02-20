import { Company } from './models/corporation'
import { NsLogger } from './logging/logger'
import { getPhaseManager } from './services/corporation/phase'
import { ProductManager } from './services/corporation/product'
import { ProductOfficeManager } from './services/corporation/product-office'
import { ProductPriceService } from './services/corporation/product-price'
import { ProductPurchaseService } from './services/corporation/product-purchase'
import { MandatoryFunService } from './services/corporation/mandatory-fun'
import { ServerCacheService } from './services/server-cache'
import { deployTargetFactory } from './models/targets/server-target'
import { ScannerService } from './services/scanner'
import { CctService } from './services/cct'
import { PurchaseService } from './services/purchase'
import { ToyPurchaseService } from './services/toy-purchase'
import { DeploymentService } from './services/deployment'
import { PayloadPlanningService } from './services/payload-planners'
import { HackerService } from './services/hacker'
import { TargetService } from './services/target'
import { PayloadService } from './services/payload'
import { AppCacheService } from './services/app-cache'
import { ShirtService } from './services/shirt'
import { SleeveUpgrader } from './services/toy-purchase/sleeve-upgrader'
import { CorpToyBudget } from './services/toy-purchase/corp'
import { BackdoorService } from './services/singularity/backdoor'
import { PathfinderService } from './services/pathfinder'
import { AugmentPrioritizer } from './services/singularity/augments'
import { AugmentToyPurchaser } from './services/singularity/toy-augments'
import { Config } from './models/config'
import { TargetFactionAugmentsService } from './services/singularity/target-faction-augments'
import { ServiceService } from './services/service'
import { CorpBribeService } from './services/singularity/corp-bribe'
import { ToyHomeImprovement } from './services/singularity/toy-home-improvement'
import { FlightController } from './services/singularity/flight'
import { HacknetHashService } from './services/hacknet'

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const config = new Config(ns)
	config.load()

	if (config.tail) {
		ns.tail()
	}

	const logger = new NsLogger(ns)
	const manager = new ServiceService(ns, logger, config)
	const company = new Company(ns)

	manager.register(
		new MandatoryFunService(ns, logger, company),
		new ProductOfficeManager(ns, logger, company),
		new ProductManager(ns, logger, company),
		new ProductPriceService(ns, logger, company),
		new ProductPurchaseService(ns, logger, company)
	)
	manager.registerFactory(() => getPhaseManager(ns, config, logger, company))

	// *** Auto-CCT ***
	const servers = new ServerCacheService(ns, deployTargetFactory)
	const scannerService = new ScannerService(
		ns,
		config,
		servers,
		deployTargetFactory
	)
	manager.register(new CctService(ns, servers, logger))

	// *** Hack Deployment & Purchasing ***
	const apps = new AppCacheService(ns)
	const toyPurchaseService = new ToyPurchaseService(ns, logger, servers, 0)
	const targetService = new TargetService()
	const payloadService = new PayloadService()
	const payloadPlanner = new PayloadPlanningService(
		ns,
		config,
		targetService,
		apps,
		logger
	)
	const hackerService = new HackerService(ns, logger)
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

	const hacknetHashService = new HacknetHashService(ns, config, logger)
	manager.register(
		new PurchaseService(
			ns,
			config,
			logger,
			servers,
			deployTargetFactory,
			toyPurchaseService
		),
		hacknetHashService
	)
	toyPurchaseService.register(hacknetHashService)

	const shirtService = new ShirtService(ns)
	manager.register(shirtService)
	toyPurchaseService.register(new SleeveUpgrader(ns, shirtService))
	toyPurchaseService.register(new CorpToyBudget(ns))

	// *** Singularity ***

	manager.registerRooted(
		new BackdoorService(ns, logger, new PathfinderService(logger, servers))
	)
	const augmentPrioritizer = new AugmentPrioritizer(ns)
	manager.register(
		new CorpBribeService(ns, logger, company, augmentPrioritizer)
	)
	toyPurchaseService.register(new AugmentToyPurchaser(ns, augmentPrioritizer))
	toyPurchaseService.register(new ToyHomeImprovement(ns))
	manager.register(new FlightController(ns, config, logger, augmentPrioritizer))
	manager.register(
		new TargetFactionAugmentsService(ns, config, logger, augmentPrioritizer)
	)

	const running = true
	while (running) {
		if (company.corporation) {
			// try to align to a specific point in company cycle
			while (company.corporation.state !== 'START') {
				await ns.sleep(20 /* ms */)
				company.updateState()
			}
		}

		augmentPrioritizer.prioritize()

		await manager.manage()

		manager.summarize()
		logger.info`${company.name} is ${company.getState()}; funds ${ns.nFormat(
			company.funds,
			'0.00a'
		)}`

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
