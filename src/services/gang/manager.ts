import { ulid } from 'ulid'
import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { AscendThresholds } from '../../models/gang'
import { ToyBudgetProvider } from '../../models/toys'

const GangBudgetThreshold = 10_000_000
const GangBudgetMultiplier = 1 / 3

export class GangManager implements ToyBudgetProvider {
	name = 'gang'
	#gang: GangGenInfo | null = null

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger
	) {}

	budget(funds: number): number {
		if (!this.#gang) {
			return 0
		}

		if (funds < GangBudgetThreshold) {
			return 0
		}

		const budget = this.#gang.moneyGainRate * GangBudgetMultiplier
		if (budget >= funds) {
			return 0
		}
		return budget
	}

	summarize() {
		if (this.#gang) {
			this.logger.info`managing ${
				this.#gang.faction
			} gang; 🤛 ${this.ns.formatNumber(this.#gang.respect)}`
		}
	}

	manage() {
		if (!this.ns.gang.inGang()) {
			if (!this.ns.getPlayer().factions.includes(this.config.gangFaction)) {
				return
			}
			if (!this.ns.gang.createGang(this.config.gangFaction)) {
				return
			}
		}

		this.#gang = this.ns.gang.getGangInformation()

		if (this.ns.gang.canRecruitMember()) {
			this.ns.gang.recruitMember(ulid())
		}

		for (const memberName of this.ns.gang.getMemberNames()) {
			const member = this.ns.gang.getMemberInformation(memberName)

			if (
				member.agi_asc_mult - member.agi_mult > AscendThresholds.agi ||
				member.def_asc_mult - member.def_mult > AscendThresholds.def ||
				member.dex_asc_mult - member.dex_mult > AscendThresholds.dex ||
				member.str_asc_mult - member.str_mult > AscendThresholds.str
			) {
				this.ns.gang.ascendMember(memberName)
			}
		}
	}
}
