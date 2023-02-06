import { first } from '@reactivex/ix-esnext-esm/iterable/first'
import { NsLogger } from '../../logging/logger'
import { ServerTarget } from '../../models/targets/server-target'
import { PathfinderService } from '../pathfinder'

export class BackdoorService {
	constructor(
		private ns: NS,
		private logger: NsLogger,
		private pathfinder: PathfinderService<ServerTarget>
	) {}

	summarize() {
		this.logger.info`backdooring servers`
	}

	async manage(rooted: Iterable<ServerTarget>) {
		for (const server of rooted) {
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
							}
						}
					}
				}
			}
		}
	}
}
