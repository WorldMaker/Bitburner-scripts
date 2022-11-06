import { Server } from '../models/server.js'
import { Stats } from '../models/stats.js'
import { findTargetDirection, TargetDirection } from '../models/target.js'

const targetHackingLevelMultiplier = 0.333

export class TargetService {
	private currentTarget: Server
	private currentDirection: TargetDirection

	constructor(startingTarget: Server) {
		this.currentTarget = startingTarget
		this.currentDirection = 'weaken'
	}

	getCurrentTarget() {
		return this.currentTarget
	}

	getCurrentDirection() {
		return this.currentDirection
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
			this.currentDirection = this.currentDirection
			newTarget = true
		}
		return newTarget
	}

	updateDirection() {
		const nextDirection = findTargetDirection(
			this.currentTarget,
			this.currentDirection
		)
		if (nextDirection !== this.currentDirection) {
			this.currentDirection = nextDirection
			return true
		}
		return false
	}
}
