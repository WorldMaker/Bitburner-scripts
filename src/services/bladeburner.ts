import { NsContext } from '../models/context'

export class BladeBurnerService {
	constructor(private readonly context: NsContext) {}

	summarize() {
		const { ns, logger } = this.context
		if (ns.bladeburner.inBladeburner()) {
			logger.info`joined bladeburner`
		}
	}

	manage() {
		const { ns } = this.context
		const player = ns.getPlayer()
		if (
			player.skills.agility < 100 ||
			player.skills.defense < 100 ||
			player.skills.dexterity < 100 ||
			player.skills.strength < 100
		) {
			return
		}

		if (!ns.bladeburner.joinBladeburnerDivision()) {
			return
		}

		// TODO: burn blades?
	}
}
