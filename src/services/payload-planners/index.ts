import { NsContext } from '../../models/context'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { ServerTarget } from '../../models/targets/server-target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'
import { MultiTargetBatchPlanner } from './multi-target-batch'
import { MultiTargetDirectionalFormulatedPlanner } from './multi-target-directional-formulated'
import { MultiTargetDirectionalRoundRobinPlanner } from './multi-target-directional-round-robin'
import { SingleTargetSinglePayloadPlanner } from './single-target-single-payload'

const BatchTotalRamThreshold = 10_000 // 10 "TB"
const BatchUtilizationThreshold = 0.25 // 25%
const SharePayload = 'payload-s.js'

class NullPlanner implements PayloadPlanner {
	plan(
		_rooted: Iterable<ServerTarget>,
		_strategy?: string | null | undefined
	): Iterable<PayloadPlan> {
		return []
	}

	summarize(): string {
		return 'not hacking'
	}

	getTotalRam(): number {
		return 0
	}

	getFreeRam(): number {
		return 0
	}
}

export class PayloadPlanningService implements PayloadPlanner {
	private strategy = 'formulated'
	private payloadPlanner: PayloadPlanner

	constructor(
		private readonly context: NsContext,
		private targetService: TargetService,
		private apps: AppCacheService
	) {
		this.payloadPlanner = this.select()
	}

	getTotalRam(): number {
		return this.payloadPlanner.getTotalRam()
	}
	getFreeRam(): number {
		return this.payloadPlanner.getFreeRam()
	}

	summarize() {
		return this.payloadPlanner.summarize()
	}

	private select() {
		const { ns, logger } = this.context
		switch (this.strategy) {
			case 'none':
				return new NullPlanner()
			case 'batch':
				return new MultiTargetBatchPlanner(
					ns,
					logger,
					this.targetService,
					this.apps
				)
			case 'multidirectional':
				return new MultiTargetDirectionalRoundRobinPlanner(
					logger,
					this.targetService,
					this.apps
				)
			case 'share':
				return new SingleTargetSinglePayloadPlanner(
					logger,
					this.targetService,
					this.apps.getApp(SharePayload)
				)
			case 'formulated':
			default:
				return new MultiTargetDirectionalFormulatedPlanner(
					ns,
					logger,
					this.targetService,
					this.apps
				)
		}
	}

	plan(rooted: Iterable<ServerTarget>) {
		if (this.context.hackStrategy !== this.strategy) {
			this.strategy = this.context.hackStrategy
			this.payloadPlanner = this.select()
		}

		const plan = this.payloadPlanner.plan(rooted)

		// *** Auto-switch from "formulated" to "batch" once RAM is high enough and utilization of it low enough ***
		if (
			this.strategy === 'formulated' &&
			this.getTotalRam() > BatchTotalRamThreshold &&
			this.getFreeRam() / this.getTotalRam() > BatchUtilizationThreshold
		) {
			this.strategy = 'batch'
			this.payloadPlanner = this.select()
		}

		this.context.hackStrategy = this.strategy

		return plan
	}
}
