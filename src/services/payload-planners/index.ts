import { NsLogger } from '../../logging/logger'
import { PayloadPlanner } from '../../models/payload-plan'
import { ServerTarget } from '../../models/targets/server-target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'
import { MultiTargetBatchPlanner } from './multi-target-batch'
import { MultiTargetDirectionalFormulatedPlanner } from './multi-target-directional-formulated'
import { MultiTargetDirectionalRoundRobinPlanner } from './multi-target-directional-round-robin'

export class PayloadPlanningService implements PayloadPlanner {
	private strategy = 'batch'
	private payloadPlanner: PayloadPlanner

	constructor(
		private ns: NS,
		private targetService: TargetService,
		private apps: AppCacheService,
		private logger: NsLogger
	) {
		this.payloadPlanner = this.select()
	}

	summarize() {
		return this.payloadPlanner.summarize()
	}

	private select() {
		switch (this.strategy) {
			case 'batch':
				return new MultiTargetBatchPlanner(
					this.ns,
					this.logger,
					this.targetService,
					this.apps
				)
			case 'multidirectional':
				return new MultiTargetDirectionalRoundRobinPlanner(
					this.logger,
					this.targetService,
					this.apps
				)
			case 'formulated':
			default:
				return new MultiTargetDirectionalFormulatedPlanner(
					this.ns,
					this.logger,
					this.targetService,
					this.apps
				)
		}
	}

	plan(rooted: Iterable<ServerTarget>, strategy: string | null = null) {
		if (strategy && strategy !== this.strategy) {
			this.strategy = strategy
			this.payloadPlanner = this.select()
		}

		return this.payloadPlanner.plan(rooted)
	}
}
