import { Logger } from './models/logger'
import { PathfinderService } from './services/pathfinder'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

export async function main(ns: NS) {
	const targetName = ns.args[0].toString()
	const depth = Number(ns.args[1]) ?? 10

	const servers = new ServerCacheService(ns)
	const scannerService = new ScannerService(ns, servers, depth)

	scannerService.scan()

	const target = servers.get(targetName)
	if (!target) {
		ns.tprint(`ERROR Unable to find '${targetName}' below depth ${depth}`)
		return
	}

	ns.tprint(
		`INFO ${
			target.name
		} valued at ${target.getWorth()}; rooted ${target.checkRooted()}`
	)

	const logger = new Logger(ns)
	const pathfinder = new PathfinderService(logger, servers)

	for (const path of pathfinder.followPaths(target)) {
		ns.tprint(`SUCCESS ${path.join(' -> ')}`)
	}
}
