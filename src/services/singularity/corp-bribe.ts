import { first } from '@reactivex/ix-esnext-esm/iterable/first'
import { NsLogger } from '../../logging/logger'
import { Company } from '../../models/corporation'
import { AugmentPrioritizer } from './augments'

export class CorpBribeService {
	#bribes = 0

	constructor(
		private readonly ns: NS,
		private readonly logger: NsLogger,
		private readonly company: Company,
		private readonly priorities: AugmentPrioritizer
	) {}

	summarize() {
		if (this.#bribes) {
			this.logger.info`${this.company.name} spent ${this.ns.nFormat(
				this.#bribes,
				'0.00a'
			)} on faction bribes`
		}
	}

	manage() {
		if (this.company.getState() !== 'Public') {
			return
		}

		const topPriority = first(this.priorities.getPriorities())
		if (!topPriority) {
			return
		}
		const { money } = this.ns.getPlayer()
		if (topPriority.cost > money) {
			return
		}
		const factionRep = this.ns.singularity.getFactionRep(topPriority.faction)
		if (topPriority.rep < factionRep) {
			return
		}

		const repNeeded = topPriority.rep - factionRep
		const { bribeAmountPerReputation } = this.ns.corporation.getConstants()

		const bribeAmount = Math.ceil(repNeeded * bribeAmountPerReputation)
		this.logger.trace`bribing ${topPriority.faction} with ${this.ns.nFormat(
			bribeAmount,
			'0.00a'
		)} to gain at least ${repNeeded} favor`
		this.ns.corporation.bribe(topPriority.faction, bribeAmount)
		this.#bribes += bribeAmount
	}
}
