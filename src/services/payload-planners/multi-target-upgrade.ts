import { Logger } from '../../models/logger'
import { PayloadPlanner } from '../../models/payload-plan'
import { Target } from '../../models/target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'
import { MultiTargetDirectionalFormulatedPlanner } from './multi-target-directional-formulated'
import { MultiTargetDirectionalRoundRobinPlanner } from './multi-target-directional-round-robin'

export class MultiTargetUpgradePlanner implements PayloadPlanner {
	private directional: PayloadPlanner
	private formulated: PayloadPlanner

	constructor(
		private ns: NS,
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		this.directional = new MultiTargetDirectionalRoundRobinPlanner(
			logger,
			targetService,
			apps
		)
		this.formulated = new MultiTargetDirectionalFormulatedPlanner(
			this.ns,
			logger,
			targetService,
			apps
		)
	}

	summarize(): string {
		if (this.ns.fileExists('Formulas.exe')) {
			return this.formulated.summarize()
		} else {
			return this.directional.summarize()
		}
	}

	plan(rooted: Iterable<Target>) {
		if (this.ns.fileExists('Formulas.exe')) {
			return this.formulated.plan(rooted)
		} else {
			return this.directional.plan(rooted)
		}
	}
}
