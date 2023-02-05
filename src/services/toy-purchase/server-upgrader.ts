import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { orderBy } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { ServerTarget } from '../../models/targets/server-target'
import { ToyPurchaser } from '../../models/toys'
import { ServerCacheService } from '../server-cache'

const { from } = IterableX

export class ServerUpgrader implements ToyPurchaser {
	readonly maxRam: number

	constructor(
		private ns: NS,
		private servers: ServerCacheService<ServerTarget>
	) {
		this.maxRam = this.ns.getPurchasedServerMaxRam()
	}

	purchase(budget: number): number {
		// *** Attempt to double purchased server RAM ***

		const purchasedServersByRam = from(this.servers.values()).pipe(
			filter((server) => server.purchased),
			orderBy((server) => server.getMaxRam())
		)

		for (const server of purchasedServersByRam) {
			if (server.getMaxRam() >= this.maxRam) {
				break
			}
			const doubleRam = Math.min(this.maxRam, server.getMaxRam() * 2)
			const cost = this.ns.getPurchasedServerUpgradeCost(server.name, doubleRam)
			if (budget > cost) {
				if (this.ns.upgradePurchasedServer(server.name, doubleRam)) {
					server.getMaxRam(true)
					budget -= cost
				}
			}
		}

		return budget
	}
}
