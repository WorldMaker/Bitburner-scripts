import { App } from '../../models/app'
import { Logger } from '../../models/logger'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { Target } from '../../models/target'
import { TargetService } from '../target'

export class SingleTargetSinglePayloadPlanner implements PayloadPlanner {
	constructor(
		private logger: Logger,
		private targetService: TargetService,
		private app: App
	) {}

	summarize() {
		return `INFO attacking ${this.targetService.getTopTarget().name}`
	}

	*plan(rooted: Iterable<Target>): Iterable<PayloadPlan> {
		for (const server of rooted) {
			if (server.getMaxRam() < this.app.ramCost) {
				this.logger.log(
					`WARN ${server.name} only has ${server.getMaxRam()} memory`
				)
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
