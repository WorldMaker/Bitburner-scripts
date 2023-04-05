import { ulid } from 'ulid'
import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { AscendThresholds } from '../../models/gang'

export class GangManager {
	#gang: GangGenInfo | null = null

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger
	) {}
	summarize() {
		if (this.#gang) {
			this.logger.info`managing ${
				this.#gang.faction
			} gang; ${this.ns.formatNumber(this.#gang.respect)} 🤛`
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
