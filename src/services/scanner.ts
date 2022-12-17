import { TargetFactory } from '../models/target.js'
import { ServerCacheService } from './server-cache.js'

const ignorelist = new Set(['home'])

export class ScannerService {
	private readonly maxDepth

	constructor(
		private ns: NS,
		private servers: ServerCacheService,
		private targetFactory: TargetFactory,
		forceMaxDepth: number | null = null
	) {
		if (forceMaxDepth) {
			this.maxDepth = forceMaxDepth
		} else {
			this.maxDepth = 100
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
				this.servers.set(this.targetFactory(this.ns, server, false))
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
