import { Server, TargetDirection } from '../models/server.js'
import { Stats } from '../models/stats.js'

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
		const securityLevel = this.currentTarget.checkSecurityLevel()
		const money = this.currentTarget.checkMoneyAvailable()
		switch (this.currentDirection) {
			case 'weaken':
				if (
					Math.round(securityLevel) === this.currentTarget.getMinSecurityLevel()
				) {
					if (money > this.currentTarget.getMoneyThreshold()) {
						this.currentDirection = 'hack'
						return true
					} else {
						this.currentDirection = 'grow'
						return true
					}
				}
				break
			case 'grow':
				if (
					securityLevel > this.currentTarget.getSecurityThreshold() ||
					money >= this.currentTarget.getWorth()
				) {
					if (money > this.currentTarget.getMoneyThreshold()) {
						this.currentDirection = 'hack'
						return true
					} else {
						this.currentDirection = 'weaken'
						return true
					}
				}
				break
			case 'hack':
				if (
					securityLevel > this.currentTarget.getSecurityThreshold() ||
					money < this.currentTarget.getMoneyThreshold()
				) {
					this.currentDirection = 'weaken'
					return true
				}
				break
		}
		return false
	}
}
