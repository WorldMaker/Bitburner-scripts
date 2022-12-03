import { Target, TargetFactory } from '../models/target.js'

export class ServerCacheService {
	private homeServer: Target
	private servers = new Map<string, Target>()

	constructor(private ns: NS, private targetFactory: TargetFactory) {
		this.homeServer = this.targetFactory(ns, 'home', true)
		const purchasedServers = this.ns.getPurchasedServers()
		for (const server of purchasedServers) {
			this.servers.set(server, this.targetFactory(this.ns, server, true))
		}
	}

	has(name: string) {
		return this.servers.has(name)
	}

	get(name: string) {
		return this.servers.get(name)
	}

	getHome() {
		return this.homeServer
	}

	set(server: Target) {
		return this.servers.set(server.name, server)
	}

	values() {
		return this.servers.values()
	}
}
