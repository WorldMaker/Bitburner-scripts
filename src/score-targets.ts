import { NsLogger } from './logging/logger'
import { Config } from './models/config'
import { PlayerStats } from './models/stats'
import {
	deployTargetFactory,
	ServerTarget,
} from './models/targets/server-target'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'
import { TargetService } from './services/target'

export async function main(ns: NS) {
	const [command] = ns.args

	const config = new Config(ns)
	config.load()

	const serverCache = new ServerCacheService(ns, deployTargetFactory)
	const scannerService = new ScannerService(
		ns,
		config,
		serverCache,
		deployTargetFactory
	)
	const stats = new PlayerStats(ns)
	const logger = new NsLogger(ns)

	const servers = scannerService.scan()

	switch (command) {
		case 'all':
			for (const server of servers) {
				logger.display(`${server.name}\t${stats.getTargetEfficiency(server)}`)
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
			targetService.assessTargets(stats, rooted)

			for (const server of targetService.getTargets()) {
				logger.display(`${server.name}\t${stats.getTargetEfficiency(server)}`)
			}
	}
}
