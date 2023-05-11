import { TargetContext } from '../models/context.js'
import { ServerTarget } from '../models/targets/server-target'
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
	private hacknetNodesToBuy = 5

	constructor(
		private context: TargetContext<ServerTarget>,
		private toyPurchaseService: ToyPurchaseService
	) {
		const { ns, servers } = this.context
		this.purchasedServerCount = ns.getPurchasedServers().length
		this.purchasedServerLimit = ns.getPurchasedServerLimit()
		this.hacknetNodesCount = ns.hacknet.numNodes()
		this.hacknetNodesToBuy = this.context.hacknetNodes
		this.nextHacknetNodePurchaseCost = ns.hacknet.getPurchaseNodeCost()
		const homeRam = servers.getHome().getMaxRam()
		this.ram = Math.min(
			MaxStartingRam,
			Math.max(8, Math.floor(homeRam * PurchasedServerRamMultiplier))
		)
		this.nextServerPurchaseCost = ns.getPurchasedServerCost(this.ram)
	}

	summarize() {
		const { logger } = this.context
		logger.log(this.toyPurchaseService.summarize())
		if (this.finishedMajorPurchases && !this.announcedFinish) {
			logger.hooray`Finished purchasing`
			this.announcedFinish = true
		}
		if (!this.finishedMajorPurchases) {
			logger.info`bought ${this.purchasedServerCount}/${this.purchasedServerLimit} servers; ${this.hacknetNodesCount}/${this.hacknetNodesToBuy} hacknet`
		}
	}

	manage() {
		this.purchase()
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
		const { ns, servers, targetFactory } = this.context
		const { money } = ns.getPlayer()
		// Focus on active income over passive (purchased servers over hacknet nodes)
		if (
			this.purchasedServerCount < ns.getPurchasedServerLimit() &&
			money > this.nextServerPurchaseCost
		) {
			const hostname = ns.purchaseServer(
				'pserv-' + this.purchasedServerCount,
				this.ram
			)
			const host = targetFactory(ns, hostname, true)
			servers.set(host)
			this.purchasedServerCount++
			this.nextServerPurchaseCost = ns.getPurchasedServerCost(this.ram)
			return true
		} else if (
			this.hacknetNodesCount < this.hacknetNodesToBuy &&
			money > this.nextHacknetNodePurchaseCost
		) {
			ns.hacknet.purchaseNode()
			this.nextHacknetNodePurchaseCost = ns.hacknet.getPurchaseNodeCost()
			this.hacknetNodesCount++
			return true
		}
		return false
	}
}
