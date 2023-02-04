import { App } from '../../models/app'
import { NsLogger } from '../../logging/logger'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { ServerTarget } from '../../models/targets/server-target'
import { TargetService } from '../target'

export class SingleTargetSinglePayloadPlanner implements PayloadPlanner {
	constructor(
		private logger: NsLogger,
		private targetService: TargetService,
		private app: App
	) {}

	summarize() {
		return `INFO attacking ${this.targetService.getTopTarget().name}`
	}

	*plan(rooted: Iterable<ServerTarget>): Iterable<PayloadPlan> {
		for (const server of rooted) {
			if (server.getMaxRam() < this.app.ramCost) {
				this.logger.warn`${server.name} only has ${server.getMaxRam()} memory`
				continue
			}
			const target = this.targetService.getTopTarget()
			if (server.checkRunning(this.app.name, ...this.app.getArgs(target))) {
				yield {
					type: 'existing',
					server,
				}
				continue
			}
			const threads = Math.floor(server.getMaxRam() / this.app.ramCost)
			yield {
				type: 'change',
				server,
				killall: true,
				deployments: [
					{
						target,
						app: this.app,
						threads,
					},
				],
			}
		}
	}
}
