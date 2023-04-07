import { NsLogger } from '../../logging/logger'
import { Company } from '../../models/corporation'
import { AugmentPrioritizer, NFG } from './augments'

export class CorpBribeService {
	#bribes = 0
	readonly #bribedFactions = new Set<string>()

	constructor(
		private readonly ns: NS,
		private readonly logger: NsLogger,
		private readonly company: Company,
		private readonly priorities: AugmentPrioritizer
	) {}

	summarize() {
		if (this.#bribes) {
			this.logger.info`${this.company.name} spent ${this.ns.formatNumber(
				this.#bribes
			)} on faction bribes`
		}
	}

	manage() {
		if (this.company.getState() !== 'Public') {
			return
		}

		const { bribeAmountPerReputation } = this.ns.corporation.getConstants()

		this.#bribedFactions.clear()
		let nfgBribe = false

		for (const priority of this.priorities.getPriorities()) {
			if (this.#bribedFactions.has(priority.faction)) {
				continue
			}
			if (nfgBribe && priority.name.startsWith(NFG)) {
				continue
			}
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
			this.logger.trace`bribing ${priority.faction} with ${this.ns.formatNumber(
				bribeAmount
			)} to gain at least ${this.ns.formatNumber(repNeeded)} favor`
			if (this.ns.corporation.bribe(priority.faction, bribeAmount)) {
				this.#bribes += bribeAmount
				if (!priority.name.startsWith(NFG)) {
					this.#bribedFactions.add(priority.faction)
				} else {
					nfgBribe = true
				}
			}
		}
	}
}
