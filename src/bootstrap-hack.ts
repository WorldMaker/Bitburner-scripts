import { DeploymentService } from './services/deployment'
import { HackerService } from './services/hacker'
import { PayloadService } from './services/payload'
import { ScannerService } from './services/scanner'

const app = 'base-hack.js'
let maxDepth = 2
let target: string = 'n00dles'

export async function main(ns: NS) {
	target = ns.args[0]?.toString() ?? target
	maxDepth = Number(ns.args[1]) ?? maxDepth
	const hackerService = new HackerService(ns)
	const scannerService = new ScannerService(ns, maxDepth)
	const payloadService = new PayloadService(ns, app)
	const deploymentService = new DeploymentService(
		ns,
		hackerService,
		payloadService,
		scannerService
	)
	deploymentService.deploy(target)
}
