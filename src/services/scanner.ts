import { TargetContext } from '../models/context'
import { Target } from '../models/targets'

const ignorelist = new Set(['home'])

export class ScannerService<T extends Target> {
	constructor(private context: TargetContext<T>) {}

	private scanServer(
		currentServer: string,
		visited: Set<string>,
		depth: number
	) {
		const { ns, servers, targetFactory } = this.context
		const targets = ns.scan(currentServer)
		for (const server of targets) {
			if (ignorelist.has(server)) {
				continue
			}
			if (!servers.has(server)) {
				servers.set(targetFactory(ns, server, false))
			}
			const target = servers.get(server)!
			target.addParent(currentServer)
			if (!visited.has(server) && depth < this.context.scanMaxDepth) {
				visited.add(server)
				this.scanServer(server, visited, depth + 1)
			}
		}
	}

	scan(server = 'home') {
		const { servers } = this.context
		this.scanServer(server, new Set(), 0)
		return [...servers.values()]
	}
}
