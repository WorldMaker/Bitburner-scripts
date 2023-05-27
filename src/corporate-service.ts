import { Company } from './models/corporation'
import { NsLogger } from './logging/logger'
import { getPhaseManager } from './services/corporation/phase'
import { ProductManager } from './services/corporation/product'
import { ProductOfficeManager } from './services/corporation/product-office'
import { ProductPriceService } from './services/corporation/product-price'
import { ProductPurchaseService } from './services/corporation/product-purchase'
import { MandatoryFunService } from './services/corporation/mandatory-fun'
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
import { DeploymentContext } from './models/context'
import { TargetFactionAugmentsService } from './services/singularity/target-faction-augments'
import { ServiceService } from './services/service'
import { CorpBribeService } from './services/singularity/corp-bribe'
import { ToyHomeImprovement } from './services/singularity/toy-home-improvement'
import { FlightController } from './services/singularity/flight'
import { HacknetHashService } from './services/hacknet'
import { DarkwebPurchaser } from './services/singularity/darkweb'
import { GangManager } from './services/gang/manager'
import { BladeBurnerService } from './services/bladeburner'

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const logger = new NsLogger(ns)
	const context = new DeploymentContext(ns, logger)
	context.load()

	if (context.tail) {
		ns.tail()
	}

	const manager = new ServiceService(context)
	const company = new Company(context)

	manager.register(
		new MandatoryFunService(company),
		new ProductOfficeManager(company),
		new ProductManager(company),
		new ProductPriceService(company),
		new ProductPurchaseService(company)
	)
	manager.registerFactory(() => getPhaseManager(company))

	// *** Auto-CCT ***
	const scannerService = new ScannerService(context)
	manager.register(new CctService(context))

	// *** Hack Deployment & Purchasing ***
	const apps = new AppCacheService(ns)
	const toyPurchaseService = new ToyPurchaseService(context)
	const targetService = new TargetService()
	const payloadService = new PayloadService()
	const payloadPlanner = new PayloadPlanningService(
		context,
		targetService,
		apps
	)
	const hackerService = new HackerService(context)
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

	const hacknetHashService = new HacknetHashService(context)
	const gangService = new GangManager(context)
	const shirtService = new ShirtService(ns)
	manager.register(
		toyPurchaseService,
		new PurchaseService(context),
		hacknetHashService,
		gangService,
		shirtService
	)
	const sleeveUpgrader = new SleeveUpgrader(ns, shirtService)
	toyPurchaseService.register(
		hacknetHashService,
		gangService,
		sleeveUpgrader,
		new CorpToyBudget(ns)
	)

	// *** Singularity ***

	manager.registerRooted(
		new BackdoorService(context, new PathfinderService(context))
	)
	const augmentPrioritizer = new AugmentPrioritizer(ns)
	toyPurchaseService.register(
		new DarkwebPurchaser(context),
		new AugmentToyPurchaser(ns, augmentPrioritizer),
		new ToyHomeImprovement(ns)
	)
	manager.register(
		new CorpBribeService(context, augmentPrioritizer),
		new FlightController(context, augmentPrioritizer),
		new TargetFactionAugmentsService(context, augmentPrioritizer, [
			gangService,
			sleeveUpgrader,
		])
	)

	// *** Bladeburner ***

	manager.register(new BladeBurnerService(context))

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
		logger.info`${
			company.name
		} is ${company.getState()}; funds ${ns.formatNumber(company.funds)}`

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
