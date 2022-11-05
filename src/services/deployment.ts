import { Server } from '../models/server.js'
import { HackerService } from './hacker.js'
import { PayloadService } from './payload.js'
import { ScannerService } from './scanner.js'
import { TargetService } from './target.js'

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
		let rooted = new Set<Server>()
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
			this.ns.tprint(`INFO Target changed to ${target}`)
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
