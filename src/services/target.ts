const targetHackingLevelMultiplier = 0.333

export class TargetService {
	private currentTarget: string
	private currentTargetLevel: number
	private currentTargetWorth: number

	constructor(private ns: NS, startingTarget: string) {
		this.currentTarget = startingTarget
		this.currentTargetLevel = this.ns.getServerRequiredHackingLevel(
			this.currentTarget
		)
		this.currentTargetWorth = this.ns.getServerMaxMoney(this.currentTarget)
	}

	getCurrentTarget() {
		return this.currentTarget
	}

	findTarget(rootedServers: Iterable<string>) {
		const hackingLevel = this.ns.getHackingLevel()
		const targetHackingLevel = hackingLevel * targetHackingLevelMultiplier
		if (hackingLevel == 1 && this.currentTarget !== 'n00dles') {
			// always starting with n00dles
			this.currentTarget = 'n00dles'
			this.currentTargetLevel = 1
			this.currentTargetWorth = this.ns.getServerMaxMoney(this.currentTarget)
			return [true, this.currentTarget]
		}
		let newTarget = false
		for (const server of rootedServers) {
			if (server === this.currentTarget) {
				continue
			}
			const serverHackingLevel = this.ns.getServerRequiredHackingLevel(server)
			if (serverHackingLevel < this.currentTargetLevel) {
				continue
			}
			if (serverHackingLevel > targetHackingLevel) {
				continue
			}
			const worth = this.ns.getServerMaxMoney(server)
			if (worth < this.currentTargetWorth) {
				continue
			}
			this.currentTarget = server
			this.currentTargetLevel = serverHackingLevel
			this.currentTargetWorth = worth
			newTarget = true
		}
		return [newTarget, this.currentTarget]
	}
}
