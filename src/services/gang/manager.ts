import { ulid } from 'ulid'
import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'

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
	}
}
