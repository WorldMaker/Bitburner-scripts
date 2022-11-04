import { Server } from '../models/server.js'

export class HackerService {
	private hackingLevel: number
	private bruteSshExists: boolean
	private ftpCrackExists: boolean
	private relaySmtpExists: boolean

	constructor(private ns: NS) {
		this.hackingLevel = this.ns.getHackingLevel()
		this.bruteSshExists = this.ns.fileExists('BruteSSH.exe')
		this.ftpCrackExists = this.ns.fileExists('FTPCrack.exe')
		this.relaySmtpExists = this.ns.fileExists('relaySMTP.exe')
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
					return true
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
