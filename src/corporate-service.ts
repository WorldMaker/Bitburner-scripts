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
import { PlayerStats } from './models/stats'
import { ShirtService } from './services/shirt'
import { SleeveUpgrader } from './services/toy-purchase/sleeve-upgrader'
import { CorpToyBudget } from './services/toy-purchase/corp'
import { BackdoorService } from './services/singularity/backdoor'
import { PathfinderService } from './services/pathfinder'
import { AugmentPrioritizer } from './services/singularity/augments'
import { AugmentToyPurchaser } from './services/singularity/toy-augments'
import { Config } from './models/config'

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const config = new Config(ns)
	config.load()

	if (config.tail) {
		ns.tail()
	}

	const logger = new NsLogger(ns)
	const company = new Company(ns)
	const mandatoryFun = new MandatoryFunService(ns, logger, company)
	const officeManager = new ProductOfficeManager(ns, logger, company)
	const productManager = new ProductManager(ns, logger, company)
	const productPriceService = new ProductPriceService(ns, company)
	const productPurchaseService = new ProductPurchaseService(ns, logger, company)

	// *** Auto-CCT ***
	const servers = new ServerCacheService(ns, deployTargetFactory)
	const scannerService = new ScannerService(
		ns,
		config,
		servers,
		deployTargetFactory
	)
	const cctService = new CctService(ns, servers, logger)

	// *** Hack Deployment & Purchasing ***
	const toyPurchaseService = new ToyPurchaseService(ns, logger, servers, 0)
	const purchaseService = new PurchaseService(
		ns,
		config,
		logger,
		servers,
		deployTargetFactory,
		toyPurchaseService
	)
	const apps = new AppCacheService(ns)
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
	const deploymentService = new DeploymentService(
		hackerService,
		logger,
		payloadPlanner,
		payloadService,
		servers,
		scannerService,
		targetService
	)

	const shirtService = new ShirtService(ns)
	toyPurchaseService.register(new SleeveUpgrader(ns, shirtService))
	toyPurchaseService.register(new CorpToyBudget(ns))

	// *** Singularity ***

	const backdoorService = new BackdoorService(
		ns,
		logger,
		new PathfinderService(logger, servers)
	)
	const augmentPrioritizer = new AugmentPrioritizer(ns)
	toyPurchaseService.register(new AugmentToyPurchaser(ns, augmentPrioritizer))

	const running = true
	while (running) {
		config.load()

		if (company.corporation) {
			// try to align to a specific point in company cycle
			while (company.corporation.state !== 'START') {
				await ns.sleep(20 /* ms */)
				company.updateState()
			}
		}
		const phaseManager = getPhaseManager(ns, logger, company)

		if (phaseManager) {
			await phaseManager.manage()
		}

		shirtService.manage()

		mandatoryFun.manage()
		officeManager.manage()
		productManager.manage()
		productPriceService.manage()
		productPurchaseService.purchase()

		const stats = new PlayerStats(ns)
		const rooted = deploymentService.deploy(stats)

		await backdoorService.manage(rooted)
		augmentPrioritizer.prioritize()

		purchaseService.purchase()

		await cctService.manage()

		backdoorService.summarize()
		logger.log(shirtService.summarize())
		purchaseService.summarize()
		deploymentService.summarize(stats)
		cctService.summarize()
		logger.log(mandatoryFun.summarize())
		logger.log(officeManager.summarize())
		logger.log(productManager.summarize())
		logger.log(productPriceService.summarize())
		logger.log(productPurchaseService.summarize())
		logger.info`${company.name} is ${company.getState()}; funds ${ns.nFormat(
			company.funds,
			'0.00a'
		)}`
		if (phaseManager) {
			logger.log(phaseManager.summarize())
		}

		config.save()
		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
