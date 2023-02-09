import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { PayloadPlanner } from '../../models/payload-plan'
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

export class PayloadPlanningService implements PayloadPlanner {
	private strategy = 'formulated'
	private payloadPlanner: PayloadPlanner

	constructor(
		private ns: NS,
		private config: Config,
		private targetService: TargetService,
		private apps: AppCacheService,
		private logger: NsLogger
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
			case 'share':
				return new SingleTargetSinglePayloadPlanner(
					this.logger,
					this.targetService,
					this.apps.getApp(SharePayload)
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

	plan(rooted: Iterable<ServerTarget>) {
		if (this.config.hackStrategy !== this.strategy) {
			this.strategy = this.config.hackStrategy
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

		this.config.hackStrategy = this.strategy

		return plan
	}
}
