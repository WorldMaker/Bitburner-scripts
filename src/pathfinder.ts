import { NsLogger } from './logging/logger'
import { simpleTargetFactory } from './models/targets/simple-target'
import { PathfinderService } from './services/pathfinder'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

export async function main(ns: NS) {
	const targetName = ns.args[0].toString()
	const depth = Number(ns.args[1]) ?? 10

	const logger = new NsLogger(ns)
	const servers = new ServerCacheService(ns, simpleTargetFactory)
	const scannerService = new ScannerService(
		ns,
		servers,
		simpleTargetFactory,
		depth
	)

	scannerService.scan()

	const target = servers.get(targetName)
	if (!target) {
		logger.ohno`Unable to find '${targetName}' below depth ${depth}`
		return
	}

	const rooted = ns.hasRootAccess(target.name)

	logger.useful`${target.name} valued at ${target.getWorth()}; rooted ${rooted}`

	if (!rooted) {
		const ports = ns.getServerNumPortsRequired(target.name)
		const hackingLevel = ns.getServerRequiredHackingLevel(target.name)
		logger.useful`hack at ${hackingLevel} with ${ports} ports`
	}

	const pathfinder = new PathfinderService(logger, servers)

	for (const path of pathfinder.followPaths(target)) {
		logger.hooray`${path.join(' -> ')}`
	}
}
