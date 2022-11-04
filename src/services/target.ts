import { Server } from '../models/server.js'

const targetHackingLevelMultiplier = 0.333

export class TargetService {
	private currentTarget: Server

	constructor(private ns: NS, startingTarget: Server) {
		this.currentTarget = startingTarget
	}

	getCurrentTarget() {
		return this.currentTarget
	}

	findTarget(rootedServers: Iterable<Server>) {
		const hackingLevel = this.ns.getHackingLevel()
		const targetHackingLevel = hackingLevel * targetHackingLevelMultiplier
		if (hackingLevel == 1 && this.currentTarget.getName() !== 'n00dles') {
			// always starting with n00dles
			this.currentTarget = new Server(this.ns, 'n00dles')
			return [true, this.currentTarget]
		}
		let newTarget = false
		for (const server of rootedServers) {
			if (server.getName() === this.currentTarget.getName()) {
				continue
			}
			if (server.getPurchased()) {
				// no need to target our own servers, presumably
				continue
			}
			const serverHackingLevel = server.getHackingLevel()
			if (serverHackingLevel < this.currentTarget.getHackingLevel()) {
				continue
			}
			if (serverHackingLevel > targetHackingLevel) {
				continue
			}
			const worth = server.getWorth()
			if (worth < this.currentTarget.getWorth()) {
				continue
			}
			this.currentTarget = server
			newTarget = true
		}
		return [newTarget, this.currentTarget]
	}
}
