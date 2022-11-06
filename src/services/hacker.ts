import { Server } from '../models/server.js'

export class HackerService {
	private hackingLevel: number
	private bruteSshExists: boolean
	private ftpCrackExists: boolean
	private relaySmtpExists: boolean
	private httpWormExists: boolean
	private sqlInjectExists: boolean

	constructor(private ns: NS) {
		this.hackingLevel = this.ns.getHackingLevel()
		this.bruteSshExists = this.ns.fileExists('BruteSSH.exe')
		this.ftpCrackExists = this.ns.fileExists('FTPCrack.exe')
		this.relaySmtpExists = this.ns.fileExists('relaySMTP.exe')
		this.httpWormExists = this.ns.fileExists('HTTPWorm.exe')
		this.sqlInjectExists = this.ns.fileExists('SQLInject.exe')
	}

	hack(server: Server) {
		if (server.checkRooted()) {
			return true
		}
		const serverLevel = server.getHackingLevel()
		if (serverLevel <= this.hackingLevel) {
			// hack
			const ports = server.getHackingPorts()
			switch (ports) {
				case 5:
					if (!this.sqlInjectExists) {
						return false
					}
					this.ns.sqlinject(server.getName())
				// continue to case 4
				case 4:
					if (!this.httpWormExists) {
						return false
					}
					this.ns.httpworm(server.getName())
				// continue to case 3
				case 3:
					if (!this.relaySmtpExists) {
						return false
					}
					this.ns.relaysmtp(server.getName())
				// continue to case 2
				case 2:
					if (!this.ftpCrackExists) {
						return false
					}
					this.ns.ftpcrack(server.getName())
				// continue to case 1
				case 1:
					if (!this.bruteSshExists) {
						return false
					}
					this.ns.brutessh(server.getName())
				// continue to case 0
				case 0:
					this.ns.nuke(server.getName())
					return server.checkRooted()
				default:
					this.ns.print(`WARN ${server.getName()} needs ${ports} ports`)
					return false
			}
		} else {
			this.ns.print(
				`WARN ${server.getName()} hacking level ${serverLevel} above ${
					this.hackingLevel
				}`
			)
		}
		return false
	}
}
