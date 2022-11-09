import { LazyTarget, Target } from '../models/target.js'

export class ServerCacheService {
	private servers = new Map<string, Target>()

	constructor(private ns: NS) {
		const purchasedServers = this.ns.getPurchasedServers()
		for (const server of purchasedServers) {
			this.servers.set(server, new LazyTarget(this.ns, server, true))
		}
	}

	has(name: string) {
		return this.servers.has(name)
	}

	get(name: string) {
		return this.servers.get(name)
	}

	set(server: Target) {
		return this.servers.set(server.name, server)
	}

	values() {
		return this.servers.values()
	}
}
