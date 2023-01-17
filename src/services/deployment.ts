import { Target } from '../models/target.js'
import { HackerService } from './hacker.js'
import { PayloadService } from './payload.js'
import { ScannerService } from './scanner.js'
import { Stats } from '../models/stats.js'
import { TargetService } from './target.js'
import { NsLogger } from '../logging/logger.js'
import { PayloadPlanner } from '../models/payload-plan.js'

export class DeploymentService {
	private lastServersCount = 0
	private lastRootedCount = 0
	private lastPayloadsCount = 0
	private plans = 0
	private existingPlans = 0
	private changedPlans = 0
	private servers = 0
	private rooted = 0
	private payloads = 0

	constructor(
		private hackerService: HackerService,
		private logger: NsLogger,
		private payloadPlanner: PayloadPlanner,
		private payloadService: PayloadService,
		private scannerService: ScannerService,
		private stats: Stats,
		private targetService: TargetService
	) {}

	summarize() {
		if (this.plans) {
			this.logger
				.info`${this.plans} deployment plans; ${this.existingPlans} existing, ${this.changedPlans} changed`
			const statusMessage = `INFO ${this.servers} servers scanned; ${this.rooted} rooted, ${this.payloads} payloads`
			// terminal notifications when changes occur otherwise regular logs
			if (
				this.servers !== this.lastServersCount ||
				this.rooted !== this.lastRootedCount ||
				this.payloads !== this.lastPayloadsCount
			) {
				this.logger.display(statusMessage)
				this.lastServersCount = this.servers
				this.lastRootedCount = this.rooted
				this.lastPayloadsCount = this.payloads
			} else {
				this.logger.log(statusMessage)
			}
		} else {
			this.logger
				.info`no deployments; no targets equal or below ${this.stats.getTargetHackingLevel()}`
		}
	}

	deploy(strategy: string | null = null) {
		// scan the planet
		const servers = this.scannerService.scan()

		// hack the planet
		const rooted = new Set<Target>()

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
		const plans = [...this.payloadPlanner.plan(rooted, strategy)]

		// deliver the payloads
		const payloads = this.payloadService.deliverAll(plans)

		this.servers = servers.length
		this.rooted = rooted.size
		this.plans = plans.length
		this.existingPlans = 0
		this.changedPlans = 0
		for (const plan of plans) {
			switch (plan.type) {
				case 'existing':
					this.existingPlans++
					break
				case 'change':
					this.changedPlans++
					break
			}
		}
		this.payloads = payloads
	}
}
