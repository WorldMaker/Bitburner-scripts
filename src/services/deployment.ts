import { Server } from '../models/server.js'
import { HackerService } from './hacker.js'
import { PayloadService } from './payload.js'
import { ScannerService } from './scanner.js'
import { Stats } from '../models/stats.js'
import { TargetService } from './target.js'
import { Logger } from '../models/logger.js'
import { PayloadPlanner } from '../models/payload-plan.js'

export class DeploymentService {
	constructor(
		private hackerService: HackerService,
		private logger: Logger,
		private payloadPlanner: PayloadPlanner,
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
		if (this.targetService.findTarget(this.stats, rooted)) {
			this.logger.display(
				`INFO Target changed to ${this.targetService.getCurrentTarget().name}`
			)
		}

		// pick a direction
		const target = this.targetService.getCurrentTarget()
		if (target.updateTargetDirection()) {
			this.logger.log(
				`INFO Direction changed to ${target.getTargetDirection()}`
			)
		}

		// plan the payloads
		const plans = [...this.payloadPlanner.plan(rooted)]

		// deliver the payloads
		const payloads = this.payloadService.deliverAll(plans)

		return {
			servers: servers.length,
			rooted: rooted.size,
			plans: plans.length,
			payloads,
		}
	}
}
