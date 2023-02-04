import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import {
	orderByDescending,
	thenBy,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { repeat } from '@reactivex/ix-esnext-esm/iterable/operators/repeat'
import { zipWith } from '@reactivex/ix-esnext-esm/iterable/operators/zipwith'
import { NsLogger } from '../../logging/logger'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { ServerTarget } from '../../models/targets/server-target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'
import { AppSelector } from './single-target-directional-payload'

const { from } = IterableX

export class MultiTargetDirectionalRoundRobinPlanner implements PayloadPlanner {
	private appSelector: AppSelector

	constructor(
		private logger: NsLogger,
		private targetService: TargetService,
		apps: AppCacheService
	) {
		this.appSelector = new AppSelector(apps)
	}

	summarize(): string {
		return `INFO attacking up to ${
			this.targetService.getTargets().length
		} targets (directional)`
	}

	*plan(rooted: Iterable<ServerTarget>): Iterable<PayloadPlan> {
		const servertargets = from(rooted).pipe(
			orderByDescending((server) => server.getMaxRam()),
			thenBy((server) => server.name),
			zipWith(from(this.targetService.getTargets()).pipe(repeat()))
		)
		for (const [server, target] of servertargets) {
			target.updateTargetDirection()
			const app = this.appSelector.selectApp(target.getTargetDirection())
			if (server.getMaxRam() < app.ramCost) {
				this.logger.warn`${server.name} only has ${server.getMaxRam()} memory`
				continue
			}
			if (server.checkRunning(app.name, ...app.getArgs(target))) {
				yield {
					type: 'existing',
					server,
				}
				continue
			}
			const threads = Math.floor(server.getMaxRam() / app.ramCost)
			yield {
				type: 'change',
				server,
				killall: true,
				deployments: [
					{
						target,
						app,
						threads,
					},
				],
			}
		}
	}
}
