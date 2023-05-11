import { DeploymentContext } from '../models/context.js'
import { PayloadPlanner } from '../models/payload-plan.js'
import { ServerTarget } from '../models/targets/server-target'
import { HackerService } from './hacker.js'
import { PayloadService } from './payload.js'
import { ScannerService } from './scanner.js'
import { TargetService } from './target.js'

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
		private context: DeploymentContext,
		private hackerService: HackerService,
		private payloadPlanner: PayloadPlanner,
		private payloadService: PayloadService,
		private scannerService: ScannerService<ServerTarget>,
		private targetService: TargetService
	) {}

	summarize() {
		const { logger, stats } = this.context
		logger.log(this.payloadPlanner.summarize())
		if (this.plans) {
			logger.info`${this.plans} deployment plans; ${this.existingPlans} existing, ${this.changedPlans} changed`
			const statusMessage = `INFO ${this.servers} servers scanned; ${this.rooted} rooted, ${this.payloads} payloads`
			// terminal notifications when changes occur otherwise regular logs
			if (
				this.servers !== this.lastServersCount ||
				this.rooted !== this.lastRootedCount ||
				this.payloads !== this.lastPayloadsCount
			) {
				logger.display(statusMessage)
				this.lastServersCount = this.servers
				this.lastRootedCount = this.rooted
				this.lastPayloadsCount = this.payloads
			} else {
				logger.log(statusMessage)
			}
		} else {
			logger.info`no deployments; no targets equal or below ${stats.getTargetHackingLevel()}`
		}
	}

	deploy() {
		const { logger, servers: serverCache, stats } = this.context

		// scan the planet
		const servers = this.scannerService.scan()

		// hack the planet
		const rooted = new Set<ServerTarget>()
		rooted.add(serverCache.getHome())

		for (const server of servers) {
			if (this.hackerService.rootServer(server)) {
				if (server.name.startsWith('hacknet-')) {
					switch (this.context.hacknetHashStrategy) {
						case 'money':
							if (
								stats.getPlayer().money > this.context.hacknetDeployThreshold
							) {
								rooted.add(server)
							}
							break
						case 'none':
						case '':
						case null:
							rooted.add(server)
							break
					}
				} else {
					rooted.add(server)
				}
			}
		}

		// pick a target
		if (this.targetService.findTarget(stats, rooted)) {
			logger.useful`Target changed to ${
				this.targetService.getTopTarget()?.name
			}`
		}

		// pick a direction
		const target = this.targetService.getTopTarget()

		if (!target) {
			logger.bigwarn`no targets`
			return rooted
		}

		if (target.updateTargetDirection()) {
			logger.info`Direction changed to ${target.getTargetDirection()}`
		}

		// plan the payloads
		const plans = [...this.payloadPlanner.plan(rooted)]

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

		return rooted
	}
}
