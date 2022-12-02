import { App, PayloadAll, PayloadG, PayloadH, PayloadW } from '../../models/app'
import { Logger } from '../../models/logger'
import { PayloadPlan, PayloadPlanner } from '../../models/payload-plan'
import { Target, TargetDirection } from '../../models/target'
import { AppCacheService } from '../app-cache'
import { TargetService } from '../target'

const PurchasedServerPayloads: Array<TargetDirection | null> = [
	null, // follower
	'weaken',
	null,
	'grow',
	'weaken',
]

export class AppSelector {
	protected payloadAll: App
	protected payloadG: App
	protected payloadH: App
	protected payloadW: App

	constructor(apps: AppCacheService) {
		this.payloadAll = apps.getApp(PayloadAll)
		this.payloadG = apps.getApp(PayloadG)
		this.payloadH = apps.getApp(PayloadH)
		this.payloadW = apps.getApp(PayloadW)
	}

	selectApp(direction: TargetDirection | 'all') {
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
}

export class SingleTargetAppSelector extends AppSelector {
	selectSingleApp(server: Target, target: Target) {
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

		return super.selectApp(direction)
	}
}

export class SingleTargetDirectionalPayloadPlanner implements PayloadPlanner {
	private readonly appSelector: SingleTargetAppSelector

	constructor(
		private logger: Logger,
		private targetService: TargetService,
		apps: AppCacheService
	) {
		this.appSelector = new SingleTargetAppSelector(apps)
	}

	summarize(): string {
		return `INFO ${this.targetService.getTopTarget().getTargetDirection()}ing ${
			this.targetService.getTopTarget().name
		}`
	}

	*plan(rooted: Iterable<Target>): Iterable<PayloadPlan> {
		for (const server of rooted) {
			const target = this.targetService.getTopTarget()
			const app = this.appSelector.selectSingleApp(server, target)

			if (server.getMaxRam() < app.ramCost) {
				this.logger.log(
					`WARN ${server.name} only has ${server.getMaxRam()} memory`
				)
				continue
			}

			if (server.checkRunning(app.name, ...app.getArgs(target))) {
				yield {
					type: 'existing',
					server,
				}
				continue
			}

			const threads = Math.floor(server.getMaxRam() / app.ramCost)

			yield {
				type: 'change',
				server,
				killall: true,
				deployments: [
					{
						target: this.targetService.getTopTarget(),
						app: app,
						threads,
					},
				],
			}
		}
	}
}
