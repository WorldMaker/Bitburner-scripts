import { NsLogger } from '../logging/logger'
import { Target } from '../models/targets'
import { ServerCacheService } from './server-cache'

export class PathfinderService<T extends Target> {
	constructor(
		private logger: NsLogger,
		private servers: ServerCacheService<T>
	) {}

	*followPaths(
		target: Target,
		suffix: string[] = [],
		visited = new Set<string>()
	): Iterable<string[]> {
		for (const parent of target.getParents()) {
			if (parent === 'home') {
				yield [target.name, ...suffix]
				return
			}
			if (visited.has(parent)) {
				continue
			}
			visited.add(parent)
			const parentTarget = this.servers.get(parent)
			if (!parentTarget) {
				// Should be interesting if such a case exists: where did we get this information?
				this.logger.display(`WARN unknown parent server "${parent}"`)
				continue
			}
			for (const path of this.followPaths(
				parentTarget,
				[target.name, ...suffix],
				visited
			)) {
				yield path
			}
		}
	}
}
