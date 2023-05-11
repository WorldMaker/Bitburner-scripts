import { TargetContext } from '../models/context'
import { Target } from '../models/targets'

export class PathfinderService<T extends Target> {
	constructor(private readonly context: TargetContext<T>) {}

	*followPaths(
		target: Target,
		suffix: string[] = [],
		visited = new Set<string>()
	): Iterable<string[]> {
		const { logger, servers } = this.context
		for (const parent of target.getParents()) {
			if (parent === 'home') {
				yield [target.name, ...suffix]
				return
			}
			if (visited.has(parent)) {
				continue
			}
			visited.add(parent)
			const parentTarget = servers.get(parent)
			if (!parentTarget) {
				// Should be interesting if such a case exists: where did we get this information?
				logger.bigwarn`unknown parent server "${parent}"`
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
