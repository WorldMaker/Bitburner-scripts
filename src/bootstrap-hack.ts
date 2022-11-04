import { DeploymentService } from './services/deployment'
import { HackerService } from './services/hacker'
import { PayloadService } from './services/payload'
import { PurchaseService } from './services/purchase'
import { ScannerService } from './services/scanner'
import { TargetService } from './services/target'

const app = 'base-hack.js'
let running = false
let maxDepth = 2

export async function main(ns: NS) {
	maxDepth = Number(ns.args[0]) ?? maxDepth
	// How much RAM each purchased server will have. Default to 8 GBs
	const ram = Number(ns.args[1]) || 8
	const hacknetNodes = Number(ns.args[2]) || 5
	const suggestedTarget = ns.args[3]?.toString() ?? 'n00dles'

	if (running) {
		return
	}

	running = true

	const targetService = new TargetService(ns, suggestedTarget)
	const payloadService = new PayloadService(ns, app)
	const purchaseService = new PurchaseService(
		ns,
		payloadService,
		targetService,
		ram,
		hacknetNodes
	)

	while (running) {
		// *** hacking and deploying payloads ***
		const hackerService = new HackerService(ns)
		const scannerService = new ScannerService(ns, maxDepth)
		const deploymentService = new DeploymentService(
			ns,
			hackerService,
			payloadService,
			scannerService,
			targetService
		)
		deploymentService.deploy()

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
