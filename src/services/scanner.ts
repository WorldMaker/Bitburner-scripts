const blacklist = new Set(['home'])

export class ScannerService {
	private servers = new Set<string>()

	constructor(private ns: NS, private maxDepth = 2) {}

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
			this.servers.add(server)
			if (!visited.has(server) && depth < this.maxDepth) {
				visited.add(server)
				this.scanServer(server, visited, depth + 1)
			}
		}
	}

	scan(server = 'home') {
		this.scanServer(server, new Set(), 0)
		return [...this.servers]
	}
}
