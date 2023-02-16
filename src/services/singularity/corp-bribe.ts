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

		const { bribeAmountPerReputation } = this.ns.corporation.getConstants()

		for (const priority of this.priorities.getPriorities()) {
			const { money } = this.ns.getPlayer()
			if (priority.cost > money) {
				continue
			}
			const factionRep = this.ns.singularity.getFactionRep(priority.faction)
			if (priority.rep < factionRep) {
				continue
			}

			const repNeeded = priority.rep - factionRep

			const bribeAmount = Math.ceil(repNeeded * bribeAmountPerReputation)
			this.logger.trace`bribing ${priority.faction} with ${this.ns.nFormat(
				bribeAmount,
				'0.00a'
			)} to gain at least ${repNeeded} favor`
			if (this.ns.corporation.bribe(priority.faction, bribeAmount)) {
				this.#bribes += bribeAmount
				return
			}
		}
	}
}
