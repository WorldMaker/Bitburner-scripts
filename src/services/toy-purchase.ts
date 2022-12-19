import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { orderBy } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { NsLogger } from '../logging/logger'
import { LazyTarget, ServerTarget, Target } from '../models/target'
import { ServerCacheService } from './server-cache'

const { from } = IterableX

const BudgetTicks = 6 /* 10s */
const ToyBudgetMultiplier = 1 / 10_000_000 /* per minute */ / BudgetTicks
const MaxRam = 2 ** 20

const Usd: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' }

export class ToyPurchaseService {
	private budget: number | null = null
	private budgetPerMinute: number | null = null

	constructor(
		private ns: NS,
		private logger: NsLogger,
		private servers: ServerCacheService,
		startingBudget: number | null
	) {
		this.budget = startingBudget
	}

	summarize() {
		return `INFO shopped for toys with budget ${this.budgetPerMinute?.toLocaleString(
			undefined,
			Usd
		)} per minute`
	}

	updateBudget() {
		if (this.budget === null) {
			return
		}
		const moneyAvailable = this.servers.getHome().checkMoneyAvailable()
		const budgetPerTick = moneyAvailable * ToyBudgetMultiplier
		this.budget += budgetPerTick
		this.budgetPerMinute = Math.round(budgetPerTick * BudgetTicks)

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

		// *** Attempt to double purchased server RAM ***

		const purchasedServersByRam = from(this.servers.values()).pipe(
			filter((server) => server.purchased),
			orderBy((server) => server.getMaxRam())
		)

		for (const server of purchasedServersByRam) {
			if (server.getMaxRam() >= MaxRam) {
				break
			}
			const doubleRam = Math.min(MaxRam, server.getMaxRam() * 2)
			const cost = this.ns.getPurchasedServerCost(doubleRam)
			if (this.budget > cost) {
				this.ns.killall(server.name)
				if (this.ns.deleteServer(server.name)) {
					const hostname = this.ns.purchaseServer(server.name, doubleRam)
					this.budget -= cost
					this.servers.set(new LazyTarget(this.ns, hostname, true))
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
			`spent toy budget ${(startingBudget - this.budget).toLocaleString(
				undefined,
				Usd
			)} / ${startingBudget.toLocaleString(undefined, Usd)}`
		)
	}
}
