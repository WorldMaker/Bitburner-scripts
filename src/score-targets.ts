import { Logger } from './models/logger'
import { PlayerStats } from './models/stats'
import { simpleTargetFactory, Target } from './models/target'
import { HackerService } from './services/hacker'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'
import { TargetService } from './services/target'

export async function main(ns: NS) {
	const [command] = ns.args

	const serverCache = new ServerCacheService(ns, simpleTargetFactory)
	const scannerService = new ScannerService(
		ns,
		serverCache,
		simpleTargetFactory
	)
	const stats = new PlayerStats(ns)
	const logger = new Logger(ns)

	const servers = scannerService.scan()

	switch (command) {
		case 'all':
			for (const server of servers) {
				logger.display(`${server.name}\t${stats.getTargetEfficiency(server)}`)
			}
		case 'targets':
		default:
			const hackerService = new HackerService(ns, logger, stats)
			let rooted = new Set<Target>()

			for (const server of servers) {
				if (hackerService.rootServer(server)) {
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
