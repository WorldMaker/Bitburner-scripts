import { DeploymentService } from './services/deployment'
import { HackerService } from './services/hacker'
import { PayloadService } from './services/payload'
import { ScannerService } from './services/scanner'
import { TargetService } from './services/target'

const app = 'base-hack.js'
let running = false
let maxDepth = 2

export async function main(ns: NS) {
	const suggestedTarget = ns.args[0]?.toString() ?? 'n00dles'
	maxDepth = Number(ns.args[1]) ?? maxDepth

	if (running) {
		return
	}

	running = true

	while (running) {
		const hackerService = new HackerService(ns)
		const scannerService = new ScannerService(ns, maxDepth)
		const payloadService = new PayloadService(ns, app)
		const targetService = new TargetService(ns, suggestedTarget)
		const deploymentService = new DeploymentService(
			ns,
			hackerService,
			payloadService,
			scannerService,
			targetService
		)
		deploymentService.deploy()
		await ns.sleep(6 /* s */ * 1000 /* ms */)
	}
}
