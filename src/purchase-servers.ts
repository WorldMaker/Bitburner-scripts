import { PayloadService } from './services/payload'
import { PurchaseService } from './services/purchase'

const app = 'base-hack.js'
const target = 'n00dles'

export async function main(ns: NS) {
	// How much RAM each purchased server will have. Default to 8 GBs
	const ram = Number(ns.args[0]) || 8
	const hacknetNodes = Number(ns.args[1]) || 5

	// Continuously try to purchase servers until we've reached the maximum
	// amount of servers
	const payloadService = new PayloadService(ns, app)
	const purchaseService = new PurchaseService(
		ns,
		payloadService,
		ram,
		hacknetNodes
	)

	while (purchaseService.wantsToPurchase()) {
		purchaseService.purchase(target)
		await ns.sleep(1 /* s */ * 1000 /* ms */)
	}
}
