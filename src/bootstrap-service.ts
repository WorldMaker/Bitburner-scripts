import { Server } from './models/server.js'
import { DeploymentService } from './services/deployment.js'
import { HackerService } from './services/hacker.js'
import { MultiPayloadService } from './services/payload.js'
import { PurchaseService } from './services/purchase.js'
import { ScannerService } from './services/scanner.js'
import { ServerCacheService } from './services/server-cache.js'
import { TargetService } from './services/target.js'

let running = false
let maxDepth = 3

export async function main(ns: NS) {
	const command = ns.args[0]?.toString()
	let hacknetNodes = 5
	let suggestedTarget = new Server(ns, 'n00dles')

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				maxDepth = Number(ns.args[1]) ?? maxDepth
				hacknetNodes = Number(ns.args[2]) || hacknetNodes
				suggestedTarget = new Server(ns, ns.args[4]?.toString() ?? 'n00dles')
				break

			case 'maxdepth':
				maxDepth = Number(ns.args[1]) ?? maxDepth
				break

			default:
				ns.tprint(`WARN Unknown command ${command}`)
				break
		}
	}

	if (running) {
		return
	}

	running = true

	const targetService = new TargetService(ns, suggestedTarget)
	const payloadService = new MultiPayloadService(ns)
	const servers = new ServerCacheService(ns)
	const purchaseService = new PurchaseService(
		ns,
		payloadService,
		servers,
		targetService,
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

		await ns.sleep(1 /* s */ * 1000 /* ms */)
	}
}
