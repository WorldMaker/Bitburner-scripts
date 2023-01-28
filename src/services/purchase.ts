import { NsLogger } from '../logging/logger.js'
import { LazyTarget } from '../models/target.js'
import { ServerCacheService } from './server-cache.js'
import { ToyPurchaseService } from './toy-purchase/index.js'

const PurchasedServerRamMultiplier = 0.015625
const MaxStartingRam = 2 ** 10

export class PurchaseService {
	private purchasedServerCount: number
	private purchasedServerLimit: number
	private hacknetNodesCount: number
	private nextServerPurchaseCost: number
	private nextHacknetNodePurchaseCost: number
	private ram: number
	private finishedMajorPurchases = false
	private announcedFinish = false

	constructor(
		private ns: NS,
		private logger: NsLogger,
		private servers: ServerCacheService,
		private toyPurchaseService: ToyPurchaseService,
		private hacknetNodesToBuy = 5
	) {
		this.purchasedServerCount = this.ns.getPurchasedServers().length
		this.purchasedServerLimit = this.ns.getPurchasedServerLimit()
		this.hacknetNodesCount = this.ns.hacknet.numNodes()
		this.nextHacknetNodePurchaseCost = this.ns.hacknet.getPurchaseNodeCost()
		const homeRam = this.servers.getHome().getMaxRam()
		this.ram = Math.min(
			MaxStartingRam,
			Math.max(8, Math.floor(homeRam * PurchasedServerRamMultiplier))
		)
		this.nextServerPurchaseCost = this.ns.getPurchasedServerCost(this.ram)
	}

	summarize() {
		this.logger.log(this.toyPurchaseService.summarize())
		if (this.finishedMajorPurchases && !this.announcedFinish) {
			this.logger.hooray`Finished purchasing`
			this.announcedFinish = true
		}
		this.logger
			.info`bought ${this.purchasedServerCount}/${this.purchasedServerLimit} servers; ${this.hacknetNodesCount}/${this.hacknetNodesToBuy} hacknet`
	}

	purchase() {
		if (this.wantsToPurchase()) {
			this.ownPurchase()
		} else {
			this.finishedMajorPurchases = true
		}

		this.toyPurchaseService.purchase()
	}

	private wantsToPurchase() {
		return (
			this.purchasedServerCount < this.purchasedServerLimit ||
			this.hacknetNodesCount < this.hacknetNodesToBuy
		)
	}

	private ownPurchase() {
		const money = this.servers.getHome().checkMoneyAvailable()
		// Focus on active income over passive (purchased servers over hacknet nodes)
		if (
			this.purchasedServerCount < this.ns.getPurchasedServerLimit() &&
			money > this.nextServerPurchaseCost
		) {
			const hostname = this.ns.purchaseServer(
				'pserv-' + this.purchasedServerCount,
				this.ram
			)
			const host = new LazyTarget(this.ns, hostname, true)
			this.servers.set(host)
			this.purchasedServerCount++
			this.nextServerPurchaseCost = this.ns.getPurchasedServerCost(this.ram)
			return true
		} else if (
			this.hacknetNodesCount < this.hacknetNodesToBuy &&
			money > this.nextHacknetNodePurchaseCost
		) {
			this.ns.hacknet.purchaseNode()
			this.nextHacknetNodePurchaseCost = this.ns.hacknet.getPurchaseNodeCost()
			this.hacknetNodesCount++
			return true
		}
		return false
	}
}
