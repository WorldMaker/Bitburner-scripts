import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { first } from '@reactivex/ix-esnext-esm/iterable/first'
import { orderByDescending } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { NsLogger } from '../../logging/logger'
import { ServerTarget } from '../../models/targets/server-target'
import { PathfinderService } from '../pathfinder'

const { from } = IterableX

export class BackdoorService {
	#backdoored = 0

	constructor(
		private ns: NS,
		private logger: NsLogger,
		private pathfinder: PathfinderService<ServerTarget>
	) {}

	summarize() {
		if (this.#backdoored) {
			this.logger.info`backdoored ${this.#backdoored} servers`
		}
	}

	async manage(rooted: Iterable<ServerTarget>) {
		for (const server of from(rooted).pipe(
			orderByDescending((target) => target.hackingLevel)
		)) {
			if (!server.purchased) {
				if (!server.getServer().backdoorInstalled) {
					this.logger.trace`backdooring ${server.name}`
					if (this.ns.singularity.connect('home')) {
						const path = first(this.pathfinder.followPaths(server))
						if (path) {
							let connected = true
							for (const name of path) {
								connected &&= this.ns.singularity.connect(name)
							}
							if (connected) {
								await this.ns.singularity.installBackdoor()
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
