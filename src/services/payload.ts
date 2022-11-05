import { Server } from '../models/server.js'

export class PayloadService {
	private appRamCost: number

	constructor(private ns: NS, private app: string) {
		this.appRamCost = this.ns.getScriptRam(app)
	}

	deliver(server: Server, target: Server, ...args: any[]) {
		if (!server.checkRooted()) {
			return false
		}
		if (this.ns.scriptRunning(this.app, server.getName())) {
			return true
		}
		const ram = server.getMaxRam()
		if (ram < this.appRamCost) {
			this.ns.print(`WARN ${server.getName()} only has ${ram} memory`)
			return false
		}
		this.ns.scp(this.app, server.getName())
		this.ns.exec(
			this.app,
			server.getName(),
			Math.floor(ram / this.appRamCost),
			'target',
			target.getName(),
			...args
		)
		return true
	}
}
