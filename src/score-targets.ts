import { NsLogger } from './logging/logger'
import { TargetContext } from './models/context'
import {
	deployTargetFactory,
	ServerTarget,
} from './models/targets/server-target'
import { ScannerService } from './services/scanner'
import { TargetService } from './services/target'

export async function main(ns: NS) {
	const [command] = ns.args

	const logger = new NsLogger(ns)
	const context = new TargetContext(ns, logger, deployTargetFactory)
	context.load()

	const scannerService = new ScannerService(context)

	const servers = scannerService.scan()

	switch (command) {
		case 'all':
			for (const server of servers) {
				logger.display(
					`${server.name}\t${context.stats.getTargetEfficiency(server)}`
				)
			}
			break
		case 'targets':
		default:
			const rooted = new Set<ServerTarget>()

			for (const server of servers) {
				if (ns.hasRootAccess(server.name)) {
					rooted.add(server)
				}
			}

			const targetService = new TargetService()
			targetService.assessTargets(context.stats, rooted)

			for (const server of targetService.getTargets()) {
				logger.display(
					`${server.name}\t${context.stats.getTargetEfficiency(server)}`
				)
			}
	}
}
