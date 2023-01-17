import { NsLogger } from '../logging/logger.js'
import { Target } from '../models/target.js'
import { Stats } from '../models/stats.js'

export class HackerService {
	private bruteSshExists: boolean
	private ftpCrackExists: boolean
	private relaySmtpExists: boolean
	private httpWormExists: boolean
	private sqlInjectExists: boolean

	constructor(private ns: NS, private logger: NsLogger) {
		this.bruteSshExists = this.ns.fileExists('BruteSSH.exe')
		this.ftpCrackExists = this.ns.fileExists('FTPCrack.exe')
		this.relaySmtpExists = this.ns.fileExists('relaySMTP.exe')
		this.httpWormExists = this.ns.fileExists('HTTPWorm.exe')
		this.sqlInjectExists = this.ns.fileExists('SQLInject.exe')
	}

	rootServer(server: Target, stats: Stats) {
		if (server.checkRooted()) {
			return true
		}

		this.bruteSshExists ||= this.ns.fileExists('BruteSSH.exe')
		this.ftpCrackExists ||= this.ns.fileExists('FTPCrack.exe')
		this.relaySmtpExists ||= this.ns.fileExists('relaySMTP.exe')
		this.httpWormExists ||= this.ns.fileExists('HTTPWorm.exe')
		this.sqlInjectExists ||= this.ns.fileExists('SQLInject.exe')

		if (server.hackingLevel <= stats.hackingLevel) {
			// hack
			const ports = server.getHackingPorts()
			switch (ports) {
				case 5:
					if (!this.sqlInjectExists) {
						return false
					}
					this.ns.sqlinject(server.name)
				// continue to case 4
				case 4:
					if (!this.httpWormExists) {
						return false
					}
					this.ns.httpworm(server.name)
				// continue to case 3
				case 3:
					if (!this.relaySmtpExists) {
						return false
					}
					this.ns.relaysmtp(server.name)
				// continue to case 2
				case 2:
					if (!this.ftpCrackExists) {
						return false
					}
					this.ns.ftpcrack(server.name)
				// continue to case 1
				case 1:
					if (!this.bruteSshExists) {
						return false
					}
					this.ns.brutessh(server.name)
				// continue to case 0
				case 0:
					this.ns.nuke(server.name)
					return server.checkRooted()
				default:
					this.logger.warn`${server.name} needs ${ports} ports`
					return false
			}
		} else {
			this.logger
				.trace`${server.name} hacking level ${stats.hackingLevel}/${server.hackingLevel}`
		}
		return false
	}
}
