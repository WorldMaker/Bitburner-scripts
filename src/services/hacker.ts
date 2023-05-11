import { TargetContext } from '../models/context.js'
import { ServerTarget } from '../models/targets/server-target'

export class HackerService {
	private bruteSshExists: boolean
	private ftpCrackExists: boolean
	private relaySmtpExists: boolean
	private httpWormExists: boolean
	private sqlInjectExists: boolean

	constructor(private context: TargetContext<ServerTarget>) {
		const { ns } = this.context
		this.bruteSshExists = ns.fileExists('BruteSSH.exe')
		this.ftpCrackExists = ns.fileExists('FTPCrack.exe')
		this.relaySmtpExists = ns.fileExists('relaySMTP.exe')
		this.httpWormExists = ns.fileExists('HTTPWorm.exe')
		this.sqlInjectExists = ns.fileExists('SQLInject.exe')
	}

	rootServer(server: ServerTarget) {
		if (server.checkRooted()) {
			return true
		}

		const { ns, logger, stats } = this.context

		this.bruteSshExists ||= ns.fileExists('BruteSSH.exe')
		this.ftpCrackExists ||= ns.fileExists('FTPCrack.exe')
		this.relaySmtpExists ||= ns.fileExists('relaySMTP.exe')
		this.httpWormExists ||= ns.fileExists('HTTPWorm.exe')
		this.sqlInjectExists ||= ns.fileExists('SQLInject.exe')

		if (server.hackingLevel <= stats.hackingLevel) {
			// hack
			const ports = server.getHackingPorts()
			switch (ports) {
				case 5:
					if (!this.sqlInjectExists) {
						return false
					}
					ns.sqlinject(server.name)
				// continue to case 4
				case 4:
					if (!this.httpWormExists) {
						return false
					}
					ns.httpworm(server.name)
				// continue to case 3
				case 3:
					if (!this.relaySmtpExists) {
						return false
					}
					ns.relaysmtp(server.name)
				// continue to case 2
				case 2:
					if (!this.ftpCrackExists) {
						return false
					}
					ns.ftpcrack(server.name)
				// continue to case 1
				case 1:
					if (!this.bruteSshExists) {
						return false
					}
					ns.brutessh(server.name)
				// continue to case 0
				case 0:
					ns.nuke(server.name)
					return server.checkRooted()
				default:
					logger.warn`${server.name} needs ${ports} ports`
					return false
			}
		} else {
			logger.trace`${server.name} hacking level ${stats.hackingLevel}/${server.hackingLevel}`
		}
		return false
	}
}
