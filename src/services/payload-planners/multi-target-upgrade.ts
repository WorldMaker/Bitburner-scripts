import { Logger } from '../../models/logger'
import { PayloadPlanner } from '../../models/payload-plan'
import { Target } from '../../models/target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'
import { MultiTargetDirectionalFormulatedPlanner } from './multi-target-directional-formulated'
import { MultiTargetDirectionalRoundRobinPlanner } from './multi-target-directional-round-robin'

export class MultiTargetUpgradePlanner implements PayloadPlanner {
	private formulasExist: boolean
	private directional: PayloadPlanner
	private formulated: PayloadPlanner

	constructor(
		private ns: NS,
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		this.formulasExist = this.ns.fileExists('Formulas.exe')
		this.directional = new MultiTargetDirectionalRoundRobinPlanner(
			logger,
			targetService,
			apps
		)
		this.formulated = new MultiTargetDirectionalFormulatedPlanner(
			this.ns,
			targetService,
			apps
		)
	}

	summarize(): string {
		this.formulasExist ||= this.ns.fileExists('Formulas.exe')
		if (this.formulasExist) {
			return this.formulated.summarize()
		} else {
			return this.directional.summarize()
		}
	}

	plan(rooted: Iterable<Target>) {
		this.formulasExist ||= this.ns.fileExists('Formulas.exe')
		if (this.formulasExist) {
			return this.formulated.plan(rooted)
		} else {
			return this.directional.plan(rooted)
		}
	}
}
