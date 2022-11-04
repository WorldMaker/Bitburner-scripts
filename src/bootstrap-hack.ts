import { HackerService } from './services/hacker'
import { PayloadService } from './services/payload'
import { ScannerService } from './services/scanner'

const app = 'base-hack.js'
let maxDepth = 2
let target: string = 'n00dles'

export async function main(ns: NS) {
	target = ns.args[0]?.toString() ?? target
	maxDepth = Number(ns.args[1]) ?? maxDepth
	// hack current target first
	const hackerService = new HackerService(ns)
	hackerService.hack(target)
	// scan the planet
	const scannerService = new ScannerService(ns, maxDepth)
	const servers = scannerService.scan()
	// hack the planet
	const payloadService = new PayloadService(ns, app)
	let rooted = 0
	let payloads = 0
	for (const server of servers) {
		if (hackerService.hack(server)) {
			rooted += 1
		}
		if (payloadService.deliver(server, target)) {
			payloads += 1
		}
	}
	ns.tprint(
		`INFO ${servers.length} servers hacked; ${rooted} rooted, ${payloads} payloads`
	)
}
