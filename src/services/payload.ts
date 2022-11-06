import { App } from '../models/app.js'
import { Logger } from '../models/logger.js'
import { Server } from '../models/server.js'
import { AppCacheService } from './app-cache.js'

const PayloadAll = 'payload-all.js'
const PayloadG = 'payload-g.js'
const PayloadH = 'payload-h.js'
const PayloadW = 'payload-w.js'
const PurchasedServerPayloads = ['weaken', 'weaken', 'grow', 'grow', null]

export class PayloadService {
	constructor(protected logger: Logger, private app: App) {}

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
		if (server.isRunning(this.app.name, 'start', target.name, ...args)) {
			return true
		}
		const ram = server.getMaxRam()
		if (ram < this.app.ramCost) {
			this.logger.log(`WARN ${server.name} only has ${ram} memory`)
			return false
		}
		server.scp(this.app.name)
		server.killall()
		const availableRam = ram - server.checkUsedRam()
		return (
			0 !==
			server.exec(
				this.app.name,
				Math.floor(availableRam / this.app.ramCost),
				'start',
				target.name,
				...args
			)
		)
	}
}

export class PayloadAllService extends PayloadService {
	constructor(logger: Logger, apps: AppCacheService) {
		super(logger, apps.getApp(PayloadAll))
	}
}

export class PayloadGService extends PayloadService {
	constructor(logger: Logger, apps: AppCacheService) {
		super(logger, apps.getApp(PayloadG))
	}

	deliver(server: Server, target: Server, ...args: any[]): boolean {
		return super.deliver(server, target, target.getSecurityThreshold(), ...args)
	}
}

export class PayloadHService extends PayloadService {
	constructor(logger: Logger, apps: AppCacheService) {
		super(logger, apps.getApp(PayloadH))
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
	constructor(logger: Logger, apps: AppCacheService) {
		super(logger, apps.getApp(PayloadW))
	}
}

export class MultiPayloadService extends PayloadService {
	private payloadAll: PayloadAllService
	private payloadG: PayloadGService
	private payloadH: PayloadHService
	private payloadW: PayloadWService

	private currentTarget: Server | null = null
	private currentServerSecurityLevel: number | null = null
	private currentServerMoneyAvailable: number | null = null

	constructor(logger: Logger, apps: AppCacheService) {
		super(logger, apps.getApp(PayloadH))
		this.payloadAll = new PayloadAllService(logger, apps)
		this.payloadG = new PayloadGService(logger, apps)
		this.payloadH = new PayloadHService(logger, apps)
		this.payloadW = new PayloadWService(logger, apps)
	}

	deliverAll(
		servers: Iterable<Server>,
		target: Server,
		...args: any[]
	): number {
		this.currentTarget = target
		this.currentServerSecurityLevel = target.checkSecurityLevel()
		this.currentServerMoneyAvailable = target.checkMoneyAvailable()
		const payloads = super.deliverAll(servers, target, ...args)
		this.logger.log(
			`INFO ${target.name} is at ${
				this.currentServerSecurityLevel
			}/${target.getSecurityThreshold()} ${
				this.currentServerMoneyAvailable
			}/${target.getMoneyThreshold()}`
		)
		return payloads
	}

	deliver(server: Server, target: Server, ...args: any[]): boolean {
		// "slow" servers get the combined "smart" payload
		if (server.isSlow) {
			return this.payloadAll.deliver(server, target, ...args)
		}
		// purchased servers get split into even, dedicated groups in deployment order of the payloads array
		if (
			server.purchased &&
			server.purchasedNumber &&
			PurchasedServerPayloads[
				server.purchasedNumber % PurchasedServerPayloads.length
			] === 'weaken'
		) {
			return this.payloadW.deliver(server, target, ...args)
		}
		if (
			server.purchased &&
			server.purchasedNumber &&
			PurchasedServerPayloads[
				server.purchasedNumber % PurchasedServerPayloads.length
			] === 'grow'
		) {
			return this.payloadG.deliver(server, target, ...args)
		}
		if (
			server.purchased &&
			server.purchasedNumber &&
			PurchasedServerPayloads[
				server.purchasedNumber % PurchasedServerPayloads.length
			] === 'hack'
		) {
			return this.payloadH.deliver(server, target, ...args)
		}
		if (this.currentTarget?.name !== target.name) {
			this.currentTarget = null
			this.currentServerSecurityLevel = null
			this.currentServerMoneyAvailable = null
		}
		if (
			(this.currentServerSecurityLevel ?? target.checkSecurityLevel()) >
			target.getSecurityThreshold()
		) {
			return this.payloadW.deliver(server, target, ...args)
		} else if (
			(this.currentServerMoneyAvailable ?? target.checkMoneyAvailable()) <
			target.getMoneyThreshold()
		) {
			return this.payloadG.deliver(server, target, ...args)
		} else {
			return this.payloadH.deliver(server, target, ...args)
		}
	}
}
