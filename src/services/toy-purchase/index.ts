import { TargetContext } from '../../models/context'
import { ServerTarget } from '../../models/targets/server-target'
import {
	BudgetTicks,
	isBudgetProvider,
	isPurchaser,
	ToyService,
} from '../../models/toys'
import { HacknetToyService } from './hacknet'
import { HacknetCachePurchaser } from './hacknet-cache'
import { ServerUpgrader } from './server-upgrader'
import { SimpleBudgetProvider } from './simple-budget'

export class ToyPurchaseService {
	private budget: number | null = null
	private budgetPerMinute = 0
	private services: ToyService[] = []

	constructor(private readonly context: TargetContext<ServerTarget>) {
		const { ns, servers } = this.context
		this.budget = this.context.toyBudget
		// Priority: register from lowest to highest priority
		this.register(new SimpleBudgetProvider())
		this.register(new HacknetToyService(ns))
		this.register(new HacknetCachePurchaser(ns))
		this.register(new ServerUpgrader(ns, servers))
	}

	register(...services: ToyService[]) {
		// Given priority in reverse order of registration (last registered, highest priority)
		this.services.unshift(...services.reverse())
	}

	summarize() {
		const { ns, logger } = this.context
		logger.info`shopped for toys with budget ${ns.formatNumber(
			this.budgetPerMinute
		)} per minute`
	}

	updateBudget() {
		const { ns, logger } = this.context

		if (this.budget === null) {
			return
		}

		const moneyAvailable = ns.getPlayer().money
		let funds = moneyAvailable
		logger.trace`💵 funds\t${ns.formatNumber(funds)}`

		this.budgetPerMinute = 0

		for (const service of this.services) {
			if (isBudgetProvider(service)) {
				const budget = service.budget(funds)
				this.budget += budget
				this.budgetPerMinute += budget * BudgetTicks
				funds -= budget
				logger.trace`💵 ${service.name}\t${ns.formatNumber(budget)}`
			}
		}

		// *** Bankruptcy Check ***

		if (this.budget > moneyAvailable) {
			// bankruptcy
			this.budget = 0
		}
	}

	purchase() {
		const { ns, logger } = this.context

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

		logger.log(
			`spent toy budget ${ns.formatNumber(
				startingBudget - this.budget
			)} / ${ns.formatNumber(startingBudget)}`
		)

		this.context.toyBudget = this.budget
	}
}
