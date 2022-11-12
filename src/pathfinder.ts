import { Target } from './models/target'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

function* followPaths(
	ns: NS,
	target: Target,
	servers: ServerCacheService,
	suffix: string[] = [],
	visited = new Set<string>()
): Iterable<string[]> {
	for (var parent of target.getParents()) {
		if (parent === 'home') {
			yield suffix
			return
		}
		if (visited.has(parent)) {
			continue
		}
		visited.add(parent)
		const parentTarget = servers.get(parent)
		if (!parentTarget) {
			// Should be interesting if such a case exists: where did we get this information?
			ns.tprint(`WARN unknown parent server "${parent}"`)
			continue
		}
		for (const path of followPaths(
			ns,
			parentTarget,
			servers,
			[target.name, ...suffix],
			visited
		)) {
			yield path
		}
	}
}

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

	for (const path of followPaths(ns, target, servers)) {
		ns.tprint(`SUCCESS ${path.join(' -> ')}`)
	}
}
