import { NsLogger } from '../logging/logger'

export class BladeBurnerService {
	constructor(private readonly ns: NS, private readonly logger: NsLogger) {}

	summarize() {
		if (this.ns.bladeburner.inBladeburner()) {
			this.logger.info`joined bladeburner`
		}
	}

	manage() {
		const player = this.ns.getPlayer()
		if (
			player.skills.agility < 100 ||
			player.skills.defense < 100 ||
			player.skills.dexterity < 100 ||
			player.skills.strength < 100
		) {
			return
		}

		if (!this.ns.bladeburner.joinBladeburnerDivision()) {
			return
		}

		// TODO: burn blades?
	}
}
