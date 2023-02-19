import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import {
	orderByDescending,
	thenBy,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { repeat } from '@reactivex/ix-esnext-esm/iterable/operators/repeat'
import { zipWith } from '@reactivex/ix-esnext-esm/iterable/operators/zipwith'
import { App } from '../../models/app'
import { NsLogger } from '../../logging/logger'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { ServerTarget } from '../../models/targets/server-target'
import { TargetService } from '../target'

const { from } = IterableX

export class MultiTargetRoundRobinPlanner implements PayloadPlanner {
	constructor(
		private logger: NsLogger,
		private targetService: TargetService,
		private app: App
	) {}

	getTotalRam(): number {
		throw new Error('Method not implemented.')
	}
	getFreeRam(): number {
		throw new Error('Method not implemented.')
	}

	summarize(): string {
		return `INFO attacking up to ${
			this.targetService.getTargets().length
		} targets`
	}

	*plan(rooted: Iterable<ServerTarget>): Iterable<PayloadPlan> {
		const servertargets = from(rooted).pipe(
			orderByDescending((server) => server.getMaxRam()),
			thenBy((server) => server.name),
			zipWith(from(this.targetService.getTargets()).pipe(repeat()))
		)
		for (const [server, target] of servertargets) {
			if (server.getMaxRam() < this.app.ramCost) {
				this.logger.warn`${server.name} only has ${server.getMaxRam()} memory`
				continue
			}
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
