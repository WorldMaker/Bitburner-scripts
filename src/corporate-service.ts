import { Company } from './models/corporation'
import { Logger } from './models/logger'
import { ProductManager } from './services/corporation/product'

let running = false

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

	while (running) {
		const company = new Company(ns)
		const logger = new Logger(ns)
		const productManager = new ProductManager(ns, company)

		productManager.manage()

		logger.log(productManager.summarize())

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
