import { Server } from '../models/server.js'
import { Stats } from '../models/stats.js'

export class TargetService {
	private currentTarget: Server

	constructor(startingTarget: Server) {
		this.currentTarget = startingTarget
	}

	getCurrentTarget() {
		return this.currentTarget
	}

	findTarget(stats: Stats, rootedServers: Iterable<Server>) {
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
			if (server.hackingLevel > stats.getTargetHackingLevel()) {
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
