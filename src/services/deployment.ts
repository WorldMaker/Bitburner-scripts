import { Target } from '../models/target.js'
import { HackerService } from './hacker.js'
import { PayloadService } from './payload.js'
import { ScannerService } from './scanner.js'
import { Stats } from '../models/stats.js'
import { TargetService } from './target.js'
import { NsLogger } from '../logging/logger.js'
import { PayloadPlanner } from '../models/payload-plan.js'

export class DeploymentService {
	constructor(
		private hackerService: HackerService,
		private logger: NsLogger,
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
		let rooted = new Set<Target>()

		for (const server of servers) {
			if (this.hackerService.rootServer(server)) {
				rooted.add(server)
			}
		}

		// pick a target
		if (this.targetService.findTarget(this.stats, rooted)) {
			this.logger.display(
				`INFO Target changed to ${this.targetService.getTopTarget()?.name}`
			)
		}

		// pick a direction
		const target = this.targetService.getTopTarget()

		if (!target) {
			this.logger.display(`WARN no targets`)
			return
		}

		if (target.updateTargetDirection()) {
			this.logger.info`INFO Direction changed to ${target.getTargetDirection()}`
		}

		// plan the payloads
		const plans = [...this.payloadPlanner.plan(rooted)]

		// deliver the payloads
		const payloads = this.payloadService.deliverAll(plans)

		return {
			servers: servers.length,
			rooted: rooted.size,
			plans: plans.length,
			existingPlans: plans.filter((plan) => plan.type === 'existing').length,
			changedPlans: plans.filter((plan) => plan.type === 'change').length,
			payloads,
		}
	}
}
