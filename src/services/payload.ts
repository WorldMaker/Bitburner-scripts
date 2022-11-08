import { App } from '../models/app.js'
import { Logger } from '../models/logger.js'
import { Server, TargetDirection } from '../models/server.js'
import { AppCacheService } from './app-cache.js'
import { TargetService } from './target.js'

const PayloadAll = 'payload-all.js'
const PayloadG = 'payload-g.js'
const PayloadH = 'payload-h.js'
const PayloadW = 'payload-w.js'
const PurchasedServerPayloads: Array<TargetDirection | null> = [
	null, // follower
	'weaken',
	null,
	'grow',
	'weaken',
]

export class PayloadService {
	constructor(
		protected logger: Logger,
		protected targetService: TargetService,
		private app: App
	) {}

	deliverAll(servers: Iterable<Server>, ...args: any[]) {
		let delivered = 0
		const target = this.targetService.getCurrentTarget()
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
	constructor(
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		super(logger, targetService, apps.getApp(PayloadAll))
	}
}

export class PayloadGService extends PayloadService {
	constructor(
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		super(logger, targetService, apps.getApp(PayloadG))
	}

	deliver(server: Server, target: Server, ...args: any[]): boolean {
		return super.deliver(server, target, target.getSecurityThreshold(), ...args)
	}
}

export class PayloadHService extends PayloadService {
	constructor(
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		super(logger, targetService, apps.getApp(PayloadH))
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
	constructor(
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		super(logger, targetService, apps.getApp(PayloadW))
	}
}

export class MultiPayloadService extends PayloadService {
	private payloadAll: PayloadAllService
	private payloadG: PayloadGService
	private payloadH: PayloadHService
	private payloadW: PayloadWService

	constructor(
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		super(logger, targetService, apps.getApp(PayloadH))
		this.payloadAll = new PayloadAllService(logger, targetService, apps)
		this.payloadG = new PayloadGService(logger, targetService, apps)
		this.payloadH = new PayloadHService(logger, targetService, apps)
		this.payloadW = new PayloadWService(logger, targetService, apps)
	}

	deliver(server: Server, target: Server, ...args: any[]): boolean {
		// "slow" servers get the combined "smart" payload
		if (server.isSlow) {
			return this.payloadAll.deliver(server, target, ...args)
		}

		let direction = target.getTargetDirection()
		// purchased servers get split into dedicated groups in deployment order of the payloads array
		if (server.purchased && server.purchasedNumber) {
			const payload =
				PurchasedServerPayloads[
					server.purchasedNumber % PurchasedServerPayloads.length
				]
			if (payload !== null) {
				direction = payload
			}
		}

		switch (direction) {
			case 'weaken':
				return this.payloadW.deliver(server, target, ...args)
			case 'grow':
				return this.payloadG.deliver(server, target, ...args)
			case 'hack':
				return this.payloadH.deliver(server, target, ...args)
			default:
				return this.payloadAll.deliver(server, target, ...args)
		}
	}
}
