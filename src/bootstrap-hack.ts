import { Server } from './models/server.js'
import { DeploymentService } from './services/deployment.js'
import { HackerService } from './services/hacker.js'
import { PayloadService } from './services/payload.js'
import { PurchaseService } from './services/purchase.js'
import { ScannerService } from './services/scanner.js'
import { ServerCacheService } from './services/server-cache.js'
import { TargetService } from './services/target.js'

const app = 'base-hack.js'
let running = false
let maxDepth = 2

export async function main(ns: NS) {
	maxDepth = Number(ns.args[0]) ?? maxDepth
	// How much RAM each purchased server will have. Default to 8 GBs
	const ram = Number(ns.args[1]) || 8
	const hacknetNodes = Number(ns.args[2]) || 5
	const suggestedTarget = new Server(ns, ns.args[3]?.toString() ?? 'n00dles')

	if (running) {
		return
	}

	running = true

	const targetService = new TargetService(ns, suggestedTarget)
	const payloadService = new PayloadService(ns, app)
	const servers = new ServerCacheService(ns)
	const purchaseService = new PurchaseService(
		ns,
		payloadService,
		servers,
		targetService,
		ram,
		hacknetNodes
	)

	let lastServersCount = 0
	let lastRootedCount = 0
	let lastPayloadsCount = 0

	while (running) {
		// *** hacking and deploying payloads ***
		const hackerService = new HackerService(ns)
		const scannerService = new ScannerService(ns, servers, maxDepth)
		const deploymentService = new DeploymentService(
			ns,
			hackerService,
			payloadService,
			scannerService,
			targetService
		)
		const counts = deploymentService.deploy()

		// general logs
		ns.print(
			`SUCCESS ${counts.servers} servers scanned; ${counts.rooted} rooted, ${counts.payloads} payloads`
		)

		// terminal notifications
		if (
			counts.servers !== lastServersCount ||
			counts.rooted !== lastRootedCount ||
			counts.payloads !== lastPayloadsCount
		) {
			ns.tprint(
				`INFO ${counts.servers} servers scanned; ${counts.rooted} rooted, ${counts.payloads} payloads`
			)
			lastServersCount = counts.servers
			lastRootedCount = counts.rooted
			lastPayloadsCount = counts.payloads
		}

		// *** purchasing servers ***
		if (purchaseService.wantsToPurchase()) {
			purchaseService.purchase()
			if (!purchaseService.wantsToPurchase()) {
				ns.tprint('SUCCESS Finished purchasing')
			}
		}

		await ns.sleep(6 /* s */ * 1000 /* ms */)
	}
}
