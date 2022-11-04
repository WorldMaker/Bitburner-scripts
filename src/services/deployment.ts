import { HackerService } from './hacker'
import { PayloadService } from './payload'
import { ScannerService } from './scanner'
import { TargetService } from './target'

export class DeploymentService {
	constructor(
		private ns: NS,
		private hackerService: HackerService,
		private payloadService: PayloadService,
		private scannerService: ScannerService,
		private targetService: TargetService
	) {}

	deploy() {
		// scan the planet
		const servers = this.scannerService.scan()

		// hack the planet
		let rooted = new Set<string>()
		let payloads = 0

		for (const server of servers) {
			if (this.hackerService.hack(server)) {
				rooted.add(server)
			}
		}

		// pick a target
		const [newTarget, target] = this.targetService.findTarget(rooted)

		if (newTarget) {
			this.ns.print(`INFO Target changed to ${target}`)
		}

		// deliver the payload
		for (const server of rooted) {
			if (this.payloadService.deliver(server, target)) {
				payloads += 1
			}
		}

		return {
			servers: servers.length,
			rooted: rooted.size,
			payloads,
		}
	}
}
