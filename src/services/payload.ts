import { App } from '../models/app.js'
import { Logger } from '../models/logger.js'
import { Server, TargetDirection } from '../models/server.js'
import {
	AppCacheService,
	PayloadAll,
	PayloadG,
	PayloadH,
	PayloadW,
} from './app-cache.js'
import { TargetService } from './target.js'

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
				...this.app.getArgs(target),
				...args
			)
		)
	}
}

export class MultiPayloadService extends PayloadService {
	private payloadAll: PayloadService
	private payloadG: PayloadService
	private payloadH: PayloadService
	private payloadW: PayloadService

	constructor(
		logger: Logger,
		targetService: TargetService,
		apps: AppCacheService
	) {
		super(logger, targetService, apps.getApp(PayloadH))
		this.payloadAll = new PayloadService(
			logger,
			targetService,
			apps.getApp(PayloadAll)
		)
		this.payloadG = new PayloadService(
			logger,
			targetService,
			apps.getApp(PayloadG)
		)
		this.payloadH = new PayloadService(
			logger,
			targetService,
			apps.getApp(PayloadH)
		)
		this.payloadW = new PayloadService(
			logger,
			targetService,
			apps.getApp(PayloadW)
		)
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
