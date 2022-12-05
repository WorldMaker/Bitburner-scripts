import { Company } from './models/corporation'
import { Logger } from './models/logger'
import { ProductManager } from './services/corporation/product'
import { ProductOfficeManager } from './services/corporation/product-office'
import { ProductPurchaseService } from './services/corporation/product-purchase'

let running = false

export async function main(ns: NS) {
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

			default:
				ns.tprint(`WARN Unknown command ${command}`)
				break
		}
	}

	if (running) {
		return
	}

	running = true

	const logger = new Logger(ns)

	while (running) {
		const company = new Company(ns)
		const officeManager = new ProductOfficeManager(ns, logger, company)
		const productManager = new ProductManager(ns, logger, company)
		const productPurchaseService = new ProductPurchaseService(ns, company)

		officeManager.manage()
		productManager.manage()
		productPurchaseService.purchase()

		logger.log(officeManager.summarize())
		logger.log(productManager.summarize())
		logger.log(productPurchaseService.summarize())
		logger.log(
			`INFO ${
				company.name
			} is ${company.getState()}; funds ${company.funds.toLocaleString(
				undefined,
				{ style: 'currency', currency: 'USD' }
			)}`
		)

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
