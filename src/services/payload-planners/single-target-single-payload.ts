import { App } from '../../models/app'
import { Logger } from '../../models/logger'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { Server } from '../../models/server'
import { TargetService } from '../target'

export class SingleTargetSinglePayloadPlanner implements PayloadPlanner {
	constructor(
		private logger: Logger,
		private targetService: TargetService,
		private app: App
	) {}

	*plan(rooted: Iterable<Server>): Iterable<PayloadPlan> {
		for (const server of rooted) {
			if (server.getMaxRam() < this.app.ramCost) {
				this.logger.log(
					`WARN ${server.name} only has ${server.getMaxRam()} memory`
				)
				continue
			}
			const target = this.targetService.getCurrentTarget()
			if (server.isRunning(this.app.name, ...this.app.getArgs(target))) {
				yield {
					type: 'existing',
					server,
				}
			}
			const usedRam = server.checkUsedRam()
			const threads = Math.floor(
				(server.getMaxRam() - usedRam) / this.app.ramCost
			)
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
