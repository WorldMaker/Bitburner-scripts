import { Server } from '../models/server.js'

const PayloadAll = 'payload-all.js'
const PayloadG = 'payload-g.js'
const PayloadH = 'payload-h.js'
const PayloadW = 'payload-w.js'
const PurchasedWeakenServerGroup = 3

export class PayloadService {
	private appRamCost: number

	constructor(protected ns: NS, private app: string) {
		this.appRamCost = this.ns.getScriptRam(app)
	}

	deliverAll(servers: Iterable<Server>, target: Server, ...args: any[]) {
		let delivered = 0
		for (const server of servers) {
			if (this.deliver(server, target, ...args)) {
				delivered++
			}
		}
		return delivered
	}

	deliver(server: Server, target: Server, ...args: any[]) {
		if (!server.getRooted()) {
			return false
		}
		if (
			this.ns.isRunning(this.app, server.name, 'start', target.name, ...args)
		) {
			return true
		}
		const ram = server.getMaxRam()
		if (ram < this.appRamCost) {
			this.ns.print(`WARN ${server.name} only has ${ram} memory`)
			return false
		}
		this.ns.scp(this.app, server.name)
		this.ns.killall(server.name)
		const availableRam = ram - this.ns.getServerUsedRam(server.name)
		return (
			0 !==
			this.ns.exec(
				this.app,
				server.name,
				Math.floor(availableRam / this.appRamCost),
				'start',
				target.name,
				...args
			)
		)
	}
}

export class PayloadAllService extends PayloadService {
	constructor(ns: NS) {
		super(ns, PayloadAll)
	}
}

export class PayloadGService extends PayloadService {
	constructor(ns: NS) {
		super(ns, PayloadG)
	}

	deliver(server: Server, target: Server, ...args: any[]): boolean {
		return super.deliver(server, target, target.getSecurityThreshold(), ...args)
	}
}

export class PayloadHService extends PayloadService {
	constructor(ns: NS) {
		super(ns, PayloadH)
	}

	deliver(server: Server, target: Server, ...args: any[]): boolean {
		return super.deliver(
			server,
			target,
			target.getSecurityThreshold(),
			target.getMoneyThreshold(),
			...args
		)
	}
}

export class PayloadWService extends PayloadService {
	constructor(ns: NS) {
		super(ns, PayloadW)
	}
}

export class MultiPayloadService extends PayloadService {
	private payloadG: PayloadGService
	private payloadH: PayloadHService
	private payloadW: PayloadWService

	private currentTarget: Server | null = null
	private currentServerSecurityLevel: number | null = null
	private currentServerMoneyAvailable: number | null = null

	constructor(ns: NS) {
		super(ns, PayloadH)
		this.payloadG = new PayloadGService(ns)
		this.payloadH = new PayloadHService(ns)
		this.payloadW = new PayloadWService(ns)
	}

	deliverAll(
		servers: Iterable<Server>,
		target: Server,
		...args: any[]
	): number {
		this.currentTarget = target
		this.currentServerSecurityLevel = this.ns.getServerSecurityLevel(
			target.name
		)
		this.currentServerMoneyAvailable = this.ns.getServerMoneyAvailable(
			target.name
		)
		const payloads = super.deliverAll(servers, target, ...args)
		this.ns.print(
			`INFO ${target.name} is at ${
				this.currentServerSecurityLevel
			}/${target.getSecurityThreshold()} ${
				this.currentServerMoneyAvailable
			}/${target.getMoneyThreshold()}`
		)
		return payloads
	}

	deliver(server: Server, target: Server, ...args: any[]): boolean {
		if (server.isSlow) {
			return this.payloadW.deliver(server, target, ...args)
		}
		if (
			server.purchased &&
			server.purchasedNumber &&
			server.purchasedNumber % PurchasedWeakenServerGroup === 1
		) {
			return this.payloadW.deliver(server, target, ...args)
		}
		if (this.currentTarget?.name !== target.name) {
			this.currentTarget = null
			this.currentServerSecurityLevel = null
			this.currentServerMoneyAvailable = null
		}
		if (
			(this.currentServerSecurityLevel ??
				this.ns.getServerSecurityLevel(target.name)) >
			target.getSecurityThreshold()
		) {
			return this.payloadW.deliver(server, target, ...args)
		} else if (
			(this.currentServerMoneyAvailable ??
				this.ns.getServerMoneyAvailable(target.name)) <
			target.getMoneyThreshold()
		) {
			return this.payloadG.deliver(server, target, ...args)
		} else {
			return this.payloadH.deliver(server, target, ...args)
		}
	}
}
