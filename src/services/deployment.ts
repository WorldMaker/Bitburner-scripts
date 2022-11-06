import { Server } from '../models/server.js'
import { HackerService } from './hacker.js'
import { PayloadService } from './payload.js'
import { ScannerService } from './scanner.js'
import { Stats } from '../models/stats.js'
import { TargetService } from './target.js'
import { Logger } from '../models/logger.js'

export class DeploymentService {
	constructor(
		private hackerService: HackerService,
		private logger: Logger,
		private payloadService: PayloadService,
		private scannerService: ScannerService,
		private stats: Stats,
		private targetService: TargetService
	) {}

	deploy() {
		// scan the planet
		const servers = this.scannerService.scan()

		// hack the planet
		let rooted = new Set<Server>()

		for (const server of servers) {
			if (this.hackerService.hack(server)) {
				rooted.add(server)
			}
		}

		// pick a target
		const [newTarget, target] = this.targetService.findTarget(
			this.stats,
			rooted
		)

		if (newTarget) {
			this.logger.display(`INFO Target changed to ${target.name}`)
		}

		// deliver the payload
		const payloads = this.payloadService.deliverAll(rooted, target)

		return {
			servers: servers.length,
			rooted: rooted.size,
			payloads,
		}
	}
}
