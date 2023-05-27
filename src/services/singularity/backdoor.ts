import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { first } from '@reactivex/ix-esnext-esm/iterable/first'
import { orderByDescending } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { ServerTarget } from '../../models/targets/server-target'
import { PathfinderService } from '../pathfinder'
import { NsContext } from '../../models/context'

const { from } = IterableX

export class BackdoorService {
	#backdoored = 0

	constructor(
		private readonly context: NsContext,
		private pathfinder: PathfinderService<ServerTarget>
	) {}

	summarize() {
		const { logger } = this.context
		if (this.#backdoored) {
			logger.info`backdoored ${this.#backdoored} servers`
		}
	}

	async manage(rooted: Iterable<ServerTarget>) {
		const { ns, logger } = this.context
		for (const server of from(rooted).pipe(
			orderByDescending((target) => target.hackingLevel)
		)) {
			if (!server.purchased) {
				if (!server.getServer().backdoorInstalled) {
					logger.trace`backdooring ${server.name}`
					if (ns.singularity.connect('home')) {
						const path = first(this.pathfinder.followPaths(server))
						if (path) {
							let connected = true
							for (const name of path) {
								connected &&= ns.singularity.connect(name)
							}
							if (connected) {
								await ns.singularity.installBackdoor()
								this.#backdoored++
							}
						}
					}
					// come back to this process on the next tick
					return
				}
			}
		}
	}
}
