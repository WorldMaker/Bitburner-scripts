import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { orderBy } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { Logger } from '../models/logger'
import { LazyTarget, ServerTarget, Target } from '../models/target'
import { ServerCacheService } from './server-cache'

const { from } = IterableX

const BudgetTicks = 6 /* 10s */
const ToyBudgetMultiplier = 1 / 10_000_000 /* per minute */ / BudgetTicks

export class ToyPurchaseService {
	private homeServer: Target
	private budget: number | null = null
	private budgetPerMinute: number | null = null
	private tickCount = 0

	constructor(
		private ns: NS,
		private logger: Logger,
		private servers: ServerCacheService,
		startingBudget: number | null
	) {
		this.homeServer = new LazyTarget(ns, 'home')
		this.budget = startingBudget
	}

	summarize() {
		return `INFO shopped for toys with budget ${this.budgetPerMinute} per minute`
	}

	updateBudget() {
		if (this.budget === null) {
			return
		}
		const budgetPerTick =
			this.homeServer.checkMoneyAvailable() * ToyBudgetMultiplier
		this.budget += budgetPerTick
		this.budgetPerMinute = Math.round(budgetPerTick * BudgetTicks)
	}

	purchase() {
		this.updateBudget()
		if (!this.budget) {
			return
		}

		const startingBudget = this.budget

		if (this.tickCount < BudgetTicks) {
			this.tickCount++
			return
		}

		// *** Attempt to double purchased server RAM ***

		const purchasedServersByRam = from(this.servers.values()).pipe(
			filter((server) => server.purchased),
			orderBy((server) => server.getMaxRam())
		)

		for (const server of purchasedServersByRam) {
			const doubleRam = server.getMaxRam() * 2
			const cost = this.ns.getPurchasedServerCost(doubleRam)
			if (this.budget > cost) {
				if (this.ns.deleteServer(server.name)) {
					const hostname = this.ns.purchaseServer(server.name, doubleRam)
					this.budget -= cost
					this.servers.set(new ServerTarget(this.ns, hostname))
					break
				}
			}
		}

		// *** Attempt to buy hackNet nodes ***
		const hacknetNodeCount = this.ns.hacknet.numNodes()

		{
			const cost = this.ns.hacknet.getPurchaseNodeCost()
			if (
				this.budget > cost &&
				hacknetNodeCount < this.ns.hacknet.maxNumNodes()
			) {
				if (this.ns.hacknet.purchaseNode() > 0) {
					this.budget -= cost
				}
			}
		}

		// *** Attempt to level hackNet nodes ***
		for (let i = 0; i < hacknetNodeCount; i++) {
			const cost = this.ns.hacknet.getLevelUpgradeCost(i, 1)
			if (this.budget > cost) {
				if (this.ns.hacknet.upgradeLevel(i, 1)) {
					this.budget -= cost
				}
			}
		}

		// *** Attempt to increase hackNet RAM ***
		for (let i = 0; i < hacknetNodeCount; i++) {
			const cost = this.ns.hacknet.getRamUpgradeCost(i, 1)
			if (this.budget > cost) {
				if (this.ns.hacknet.upgradeRam(i, 1)) {
					this.budget -= cost
				}
			}
		}

		// *** Attempt to increase hackNet Cores ***
		for (let i = 0; i < hacknetNodeCount; i++) {
			const cost = this.ns.hacknet.getCoreUpgradeCost(i, 1)
			if (this.budget > cost) {
				if (this.ns.hacknet.upgradeCore(i, 1)) {
					this.budget -= cost
				}
			}
		}

		this.logger.log(
			`SUCCESS spent toy budget ${
				startingBudget - this.budget
			} / ${startingBudget}`
		)
		this.tickCount = 0
	}
}
