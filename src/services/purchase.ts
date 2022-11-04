import { Server } from '../models/server.js'
import { PayloadService } from './payload.js'
import { ServerCacheService } from './server-cache.js'
import { TargetService } from './target.js'

export class PurchaseService {
	private purchasedServerCount: number
	private purchasedServerLimit: number
	private hacknetNodesCount: number
	private nextServerPurchaseCost: number
	private nextHacknetNodePurchaseCost: number

	constructor(
		private ns: NS,
		private payloadService: PayloadService,
		private servers: ServerCacheService,
		private targetService: TargetService,
		private ram: number,
		private hacknetNodesToBuy = 0
	) {
		this.purchasedServerCount = this.ns.getPurchasedServers().length
		this.purchasedServerLimit = this.ns.getPurchasedServerLimit()
		this.hacknetNodesCount = this.ns.hacknet.numNodes()
		this.nextHacknetNodePurchaseCost = this.ns.hacknet.getPurchaseNodeCost()
		this.nextServerPurchaseCost = this.ns.getPurchasedServerCost(this.ram)
	}

	wantsToPurchase() {
		return (
			this.purchasedServerCount < this.purchasedServerLimit ||
			this.hacknetNodesCount < this.hacknetNodesToBuy
		)
	}

	purchase() {
		const money = this.ns.getServerMoneyAvailable('home')
		// Focus on active income over passive (purchased servers over hacknet nodes)
		if (
			this.purchasedServerCount < this.ns.getPurchasedServerLimit() &&
			money > this.nextServerPurchaseCost
		) {
			const hostname = this.ns.purchaseServer(
				'pserv-' + this.purchasedServerCount,
				this.ram
			)
			const host = new Server(this.ns, hostname, true)
			this.servers.set(host)
			this.payloadService.deliver(host, this.targetService.getCurrentTarget())
			this.purchasedServerCount++
			this.nextServerPurchaseCost = this.ns.getPurchasedServerCost(this.ram)
			return true
		} else if (
			this.hacknetNodesCount < this.hacknetNodesToBuy &&
			money > this.nextHacknetNodePurchaseCost
		) {
			this.ns.hacknet.purchaseNode()
			this.nextHacknetNodePurchaseCost = this.ns.hacknet.getPurchaseNodeCost()
			return true
		}
		return false
	}
}
