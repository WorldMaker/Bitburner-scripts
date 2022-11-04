export class PayloadService {
	private appRamCost: number

	constructor(private ns: NS, private app: string) {
		this.appRamCost = this.ns.getScriptRam(app)
	}

	deliver(server: string, ...args: any[]) {
		if (!this.ns.hasRootAccess(server)) {
			return false
		}
		if (this.ns.isRunning(this.app, server, ...args)) {
			return true
		}
		const ram = this.ns.getServerMaxRam(server)
		if (ram < this.appRamCost) {
			this.ns.tprint(`WARN ${server} only has ${ram} memory`)
			return false
		}
		this.ns.scp(this.app, server)
		this.ns.killall(server)
		this.ns.exec(this.app, server, Math.floor(ram / this.appRamCost), ...args)
		return true
	}
}
