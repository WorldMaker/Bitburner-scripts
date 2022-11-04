import { Server } from '../models/server'
import { ServerCacheService } from './server-cache'

const blacklist = new Set(['home'])

export class ScannerService {
	constructor(
		private ns: NS,
		private servers: ServerCacheService,
		private maxDepth = 2
	) {}

	private scanServer(
		currentServer: string,
		visited: Set<string>,
		depth: number
	) {
		const servers = this.ns.scan(currentServer)
		for (const server of servers) {
			if (blacklist.has(server)) {
				continue
			}
			if (!this.servers.has(server)) {
				this.servers.set(new Server(this.ns, server))
			}
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
