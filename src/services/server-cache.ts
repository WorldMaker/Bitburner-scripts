import { Server } from '../models/server.js'

export class ServerCacheService {
	private servers = new Map<string, Server>()

	constructor(private ns: NS) {
		const purchasedServers = this.ns.getPurchasedServers()
		for (const server of purchasedServers) {
			this.servers.set(server, new Server(this.ns, server, true))
		}
	}

	has(name: string) {
		return this.servers.has(name)
	}

	get(name: string) {
		return this.servers.get(name)
	}

	set(server: Server) {
		return this.servers.set(server.name, server)
	}

	values() {
		return this.servers.values()
	}
}
