import { NsContext } from '../../models/context'
import { AugmentPrioritizer, NFG } from './augments'

export class CorpBribeService {
	#bribes = 0
	readonly #bribedFactions = new Set<string>()

	constructor(
		private readonly context: NsContext,
		private readonly priorities: AugmentPrioritizer
	) {}

	summarize() {
		const { ns, logger } = this.context
		if (this.#bribes) {
			logger.info`spent ${ns.formatNumber(
				this.#bribes
			)} corporate money on faction bribes`
		}
	}

	manage() {
		const { ns, logger, hasPublicCompany } = this.context

		if (!hasPublicCompany) {
			return
		}

		const { bribeAmountPerReputation } = ns.corporation.getConstants()

		this.#bribedFactions.clear()

		// assume we can't bribe the gang faction
		if (this.context.gangFaction) {
			this.#bribedFactions.add(this.context.gangFaction)
		}

		let nfgBribe = false

		for (const priority of this.priorities.getPriorities()) {
			if (this.#bribedFactions.has(priority.faction)) {
				continue
			}
			if (nfgBribe && priority.name.startsWith(NFG)) {
				continue
			}
			const { money } = ns.getPlayer()
			if (priority.cost > money) {
				continue
			}
			const factionRep = ns.singularity.getFactionRep(priority.faction)
			if (priority.rep < factionRep) {
				continue
			}

			const repNeeded = priority.rep - factionRep

			const bribeAmount = Math.ceil(repNeeded * bribeAmountPerReputation)
			logger.trace`bribing ${priority.faction} with ${ns.formatNumber(
				bribeAmount
			)} to gain at least ${ns.formatNumber(repNeeded)} favor`
			if (ns.corporation.bribe(priority.faction, bribeAmount)) {
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
