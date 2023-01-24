import { Company } from './models/corporation'
import { NsLogger } from './logging/logger'
import { getPhaseManager } from './services/corporation/phase'
import { ProductManager } from './services/corporation/product'
import { ProductOfficeManager } from './services/corporation/product-office'
import { ProductPriceService } from './services/corporation/product-price'
import { ProductPurchaseService } from './services/corporation/product-purchase'
import { MandatoryFunService } from './services/corporation/mandatory-fun'
import { ServerCacheService } from './services/server-cache'
import { deployTargetFactory } from './models/target'
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

let running = false
let strategy: string | null = null

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const command = ns.args[0]?.toString()

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				ns.tail()
				break

			case 'strategy':
				strategy = ns.args[1]?.toString()
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

	const logger = new NsLogger(ns)
	const company = new Company(ns)
	const mandatoryFun = new MandatoryFunService(ns, logger, company)
	const officeManager = new ProductOfficeManager(ns, logger, company)
	const productManager = new ProductManager(ns, logger, company)
	const productPriceService = new ProductPriceService(ns, company)
	const productPurchaseService = new ProductPurchaseService(ns, logger, company)

	// *** Auto-CCT ***
	const servers = new ServerCacheService(ns, deployTargetFactory)
	const scannerService = new ScannerService(ns, servers, deployTargetFactory)
	const cctService = new CctService(ns, servers, logger)

	// *** Hack Deployment & Purchasing ***
	const toyPurchaseService = new ToyPurchaseService(ns, logger, servers, 0)
	const purchaseService = new PurchaseService(
		ns,
		logger,
		servers,
		toyPurchaseService
	)
	const apps = new AppCacheService(ns)
	const targetService = new TargetService()
	const payloadService = new PayloadService()
	const payloadPlanner = new PayloadPlanningService(
		ns,
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
		scannerService,
		targetService
	)

	const shirtService = new ShirtService(ns)

	while (running) {
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
		deploymentService.deploy(stats, strategy)

		purchaseService.purchase()

		await cctService.manage()

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

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
