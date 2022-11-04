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

	hack(server: string) {
		if (this.ns.hasRootAccess(server)) {
			return true
		}
		const serverLevel = this.ns.getServerRequiredHackingLevel(server)
		if (serverLevel <= this.hackingLevel) {
			// hack
			const ports = this.ns.getServerNumPortsRequired(server)
			switch (ports) {
				case 3:
					if (!this.relaySmtpExists) {
						return false
					}
					this.ns.relaysmtp(server)
				// continue to case 2
				case 2:
					if (!this.ftpCrackExists) {
						return false
					}
					this.ns.ftpcrack(server)
				// continue to case 1
				case 1:
					if (!this.bruteSshExists) {
						return false
					}
					this.ns.brutessh(server)
				// continue to case 0
				case 0:
					this.ns.nuke(server)
					return true
				default:
					this.ns.print(`WARN ${server} needs ${ports} ports`)
					return false
			}
		} else {
			this.ns.print(
				`WARN ${server} hacking level ${serverLevel} above ${this.hackingLevel}`
			)
		}
		return false
	}
}
