import { Target, TargetFactory } from '.'

export const deployTargetFactory: TargetFactory<ServerTarget> = (
	ns: NS,
	name: string,
	purchased?: boolean
) => new ServerTarget(ns, name, purchased ?? false)

const HomeRamUtilizationFloor = 2048

/**
 * Server Target uses get server to bulk load server information
 */
export class ServerTarget extends Target {
	private server: Server
	public readonly hackingLevel: number

	constructor(ns: NS, name: string, _purchased: boolean) {
		const server = ns.getServer(name)
		const purchased = server.purchasedByPlayer

		super(ns, name, purchased)

		this.server = server
		this.hackingLevel = server.requiredHackingSkill ?? Infinity
	}

	getServer() {
		this.server = this.ns.getServer(this.name)
		return this.server
	}

	getHackingPorts() {
		return this.server.numOpenPortsRequired
	}

	getMaxRam(recheck = false) {
		if (recheck) {
			this.server = this.ns.getServer(this.name)
		}
		if (this.name === 'home') {
			return Math.max(0, this.server.maxRam - HomeRamUtilizationFloor)
		}
		return this.server.maxRam
	}

	getRooted() {
		return this.server.hasAdminRights
	}

	checkRooted() {
		if (this.server.hasAdminRights) {
			return this.server.hasAdminRights
		}
		this.server = this.ns.getServer(this.name)
		return this.server.hasAdminRights
	}

	checkUsedRam() {
		this.server = this.ns.getServer(this.name)
		return this.server.ramUsed
	}

	// *** Simple Target overrides ***

	getMinSecurityLevel(): number {
		return this.server.minDifficulty ?? 1
	}

	getWorth(): number {
		return this.server.moneyMax ?? 0
	}

	checkMoneyAvailable(): number {
		this.server = this.ns.getServer(this.name)
		return this.server.moneyAvailable ?? 0
	}

	checkSecurityLevel(): number {
		this.server = this.ns.getServer(this.name)
		return this.server.hackDifficulty ?? Infinity
	}

	checkRunning(
		script: FilenameOrPID,
		...args: (string | number | boolean)[]
	): boolean {
		return this.ns.isRunning(script, this.name, ...args)
	}

	copyFiles(files: string | string[], source?: string): boolean {
		return this.ns.scp(files, this.name, source)
	}

	clearProcesses(safetyGuard?: boolean): boolean {
		return this.ns.killall(this.name, safetyGuard)
	}

	clearProcess(
		script: string,
		...args: (string | number | boolean)[]
	): boolean {
		return this.ns.kill(script, this.name, ...args)
	}

	startProcess(
		script: string,
		threads = 1,
		...args: (string | number | boolean)[]
	): number {
		return this.ns.exec(script, this.name, threads, ...args)
	}
}
