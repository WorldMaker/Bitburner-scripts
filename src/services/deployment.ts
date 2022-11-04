import { HackerService } from "./hacker";
import { PayloadService } from "./payload";
import { ScannerService } from "./scanner";

export class DeploymentService {
    constructor(private ns: NS, private hackerService: HackerService, private payloadService: PayloadService, private scannerService: ScannerService) {}

    deploy(target: string) {
        this.hackerService.hack(target)
        // scan the planet
        const servers = this.scannerService.scan()
        // hack the planet
        let rooted = 0
        let payloads = 0
        for (const server of servers) {
            if (this.hackerService.hack(server)) {
                rooted += 1
            }
            if (this.payloadService.deliver(server, target)) {
                payloads += 1
            }
        }
        this.ns.tprint(
            `INFO ${servers.length} servers hacked; ${rooted} rooted, ${payloads} payloads`
        )
    }
}