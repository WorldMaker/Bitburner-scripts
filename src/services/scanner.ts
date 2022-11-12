import { LazyTarget, ServerTarget } from '../models/target.js'
import { ServerCacheService } from './server-cache.js'

const ignorelist = new Set(['home'])

export class ScannerService {
	private readonly maxDepth

	constructor(
		private ns: NS,
		private servers: ServerCacheService,
		forceMaxDepth: number | null = null
	) {
		const deepScanV1 = this.ns.fileExists('DeepscanV1.exe')
		const deepScanV2 = this.ns.fileExists('DeepscanV2.exe')
		if (deepScanV2) {
			this.maxDepth = 10
		} else if (deepScanV1) {
			this.maxDepth = 5
		} else {
			this.maxDepth = 3
		}

		if (forceMaxDepth) {
			this.maxDepth = forceMaxDepth
		}
	}

	private scanServer(
		currentServer: string,
		visited: Set<string>,
		depth: number
	) {
		const servers = this.ns.scan(currentServer)
		for (const server of servers) {
			if (ignorelist.has(server)) {
				continue
			}
			if (!this.servers.has(server)) {
				this.servers.set(new LazyTarget(this.ns, server, false))
			}
			const target = this.servers.get(server)!
			target.addParent(currentServer)
			if (!visited.has(server) && depth < this.maxDepth) {
				visited.add(server)
				this.scanServer(server, visited, depth + 1)
			}
		}
	}

	scan(server = 'home') {
		this.scanServer(server, new Set(), 0)
		return [...this.servers.values()]
	}
}
