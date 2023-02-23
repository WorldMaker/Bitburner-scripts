import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { ServerTarget } from '../../models/targets/server-target'
import {
	BudgetTicks,
	isBudgetProvider,
	isPurchaser,
	ToyService,
} from '../../models/toys'
import { ServerCacheService } from '../server-cache'
import { HacknetToyService } from './hacknet'
import { HacknetCachePurchaser } from './hacknet-cache'
import { ServerUpgrader } from './server-upgrader'
import { SimpleBudgetProvider } from './simple-budget'

export class ToyPurchaseService {
	private budget: number | null = null
	private budgetPerMinute = 0
	private services: ToyService[] = []

	constructor(
		private ns: NS,
		private config: Config,
		private logger: NsLogger,
		servers: ServerCacheService<ServerTarget>
	) {
		this.budget = this.config.toyBudget
		// Priority: register from lowest to highest priority
		this.register(new SimpleBudgetProvider())
		this.register(new HacknetToyService(ns))
		this.register(new HacknetCachePurchaser(ns))
		this.register(new ServerUpgrader(ns, servers))
	}

	register(service: ToyService) {
		// Given priority in reverse order of registration (last registered, highest priority)
		this.services.unshift(service)
	}

	summarize() {
		return `INFO shopped for toys with budget ${this.ns.formatNumber(
			this.budgetPerMinute
		)} per minute`
	}

	updateBudget() {
		if (this.budget === null) {
			return
		}

		const moneyAvailable = this.ns.getPlayer().money
		let funds = moneyAvailable
		this.logger.trace`💵 funds\t${this.ns.formatNumber(funds)}`

		this.budgetPerMinute = 0

		for (const service of this.services) {
			if (isBudgetProvider(service)) {
				const budget = service.budget(funds)
				this.budget += budget
				this.budgetPerMinute += budget * BudgetTicks
				funds -= budget
				this.logger.trace`💵 ${service.name}\t${this.ns.formatNumber(budget)}`
			}
		}

		// *** Bankruptcy Check ***

		if (this.budget > moneyAvailable) {
			// bankruptcy
			this.budget = 0
		}
	}

	purchase() {
		this.updateBudget()
		if (!this.budget) {
			return
		}

		const startingBudget = this.budget

		for (const service of this.services) {
			if (isPurchaser(service)) {
				this.budget = service.purchase(this.budget)
			}
		}

		this.logger.log(
			`spent toy budget ${this.ns.formatNumber(
				startingBudget - this.budget
			)} / ${this.ns.formatNumber(startingBudget)}`
		)

		this.config.toyBudget = this.budget
	}
}
