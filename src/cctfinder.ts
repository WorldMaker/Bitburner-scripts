import { simpleTargetFactory } from './models/target'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

export async function main(ns: NS) {
	const depth = Number(ns.args[0]) ?? 100

	const servers = new ServerCacheService(ns, simpleTargetFactory)
	const scannerService = new ScannerService(
		ns,
		servers,
		simpleTargetFactory,
		depth
	)

	scannerService.scan()

	for (const server of servers.values()) {
		const cctFiles = ns.ls(server.name, '.cct')
		if (cctFiles.length) {
			ns.tprint(`${server.name}\t${cctFiles.join(', ')}`)
		}
	}
}
