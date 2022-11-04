const app = 'base-hack.js'
const appRamCost = 2.4
const target = 'n00dles'

export async function main(ns: NS) {
	// How much RAM each purchased server will have. Default to 8 GBs
	const ram = Number(ns.args[0]) || 8
	const threads = Math.floor(ram / appRamCost)

	// Iterator we'll use for our loop
	let i = 0

	// Continuously try to purchase servers until we've reached the maximum
	// amount of servers
	while (i < ns.getPurchasedServerLimit()) {
		// Check if we have enough money to purchase a server
		if (ns.getServerMoneyAvailable('home') > ns.getPurchasedServerCost(ram)) {
			// If we have enough money, then:
			//  1. Purchase the server
			//  2. Copy our hacking script onto the newly-purchased server
			//  3. Run our hacking script on the newly-purchased server with 3 threads
			//  4. Increment our iterator to indicate that we've bought a new server
			const hostname = ns.purchaseServer('pserv-' + i, ram)
			ns.scp(app, hostname)
			ns.exec(app, hostname, threads, target)
			++i
		}
		await ns.sleep(1 /* s */ * 1000 /* ms */)
	}
}
