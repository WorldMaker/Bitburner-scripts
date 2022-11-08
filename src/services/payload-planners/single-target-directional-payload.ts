import { App } from '../../models/app'
import { Logger } from '../../models/logger'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { Server, TargetDirection } from '../../models/server'
import {
	AppCacheService,
	PayloadAll,
	PayloadG,
	PayloadH,
	PayloadW,
} from '../app-cache'
import { TargetService } from '../target'

const PurchasedServerPayloads: Array<TargetDirection | null> = [
	null, // follower
	'weaken',
	null,
	'grow',
	'weaken',
]

export class SingleTargetDirectionalPayloadPlanner implements PayloadPlanner {
	private payloadAll: App
	private payloadG: App
	private payloadH: App
	private payloadW: App

	constructor(
		private logger: Logger,
		private targetService: TargetService,
		apps: AppCacheService
	) {
		this.payloadAll = apps.getApp(PayloadAll)
		this.payloadG = apps.getApp(PayloadG)
		this.payloadH = apps.getApp(PayloadH)
		this.payloadW = apps.getApp(PayloadW)
	}

	selectApp(server: Server, target: Server) {
		// "slow" servers get the combined "smart" payload
		if (server.isSlow) {
			return this.payloadAll
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
				return this.payloadW
			case 'grow':
				return this.payloadG
			case 'hack':
				return this.payloadH
			default:
				return this.payloadAll
		}
	}

	*plan(rooted: Iterable<Server>): Iterable<PayloadPlan> {
		for (const server of rooted) {
			const target = this.targetService.getCurrentTarget()
			const app = this.selectApp(server, target)

			if (server.getMaxRam() < app.ramCost) {
				this.logger.log(
					`WARN ${server.name} only has ${server.getMaxRam()} memory`
				)
				continue
			}

			if (server.isRunning(app.name, ...app.getArgs(target))) {
				yield {
					type: 'existing',
					server,
				}
			}

			const usedRam = server.checkUsedRam()
			const threads = Math.floor((server.getMaxRam() - usedRam) / app.ramCost)

			yield {
				type: 'change',
				server,
				killall: true,
				deployments: [
					{
						target: this.targetService.getCurrentTarget(),
						app: app,
						threads,
					},
				],
			}
		}
	}
}
