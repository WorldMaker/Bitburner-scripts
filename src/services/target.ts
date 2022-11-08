import { Server } from '../models/server.js'
import { Stats } from '../models/stats.js'

const targetHackingLevelMultiplier = 0.333

export class TargetService {
	private currentTarget: Server

	constructor(startingTarget: Server) {
		this.currentTarget = startingTarget
	}

	getCurrentTarget() {
		return this.currentTarget
	}

	findTarget(stats: Stats, rootedServers: Iterable<Server>) {
		const targetHackingLevel = Math.max(
			1,
			stats.hackingLevel * targetHackingLevelMultiplier
		)
		let newTarget = false
		for (const server of rootedServers) {
			if (server.name === this.currentTarget.name) {
				continue
			}
			if (server.purchased) {
				// no need to target our own servers, presumably
				continue
			}
			if (server.hackingLevel < this.currentTarget.hackingLevel) {
				continue
			}
			if (server.hackingLevel > targetHackingLevel) {
				continue
			}
			const worth = server.getWorth()
			if (worth < this.currentTarget.getWorth()) {
				continue
			}
			this.currentTarget = server
			newTarget = true
		}
		return newTarget
	}
}
