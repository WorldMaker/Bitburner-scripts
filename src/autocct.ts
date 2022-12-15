import { evaluateCct } from './cct'
import { simpleTargetFactory } from './models/target'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

export async function main(ns: NS) {
	const depth = Number(ns.args[0]) ?? 100

	const servers = new ServerCacheService(ns, simpleTargetFactory)
	const scannerService = new ScannerService(
		ns,
		servers,
		simpleTargetFactory,
		depth
	)

	scannerService.scan()

	for (const server of servers.values()) {
		const cctFiles = ns.ls(server.name, '.cct')
		if (cctFiles.length) {
			ns.tprint(server.name)
			for (const cctFile of cctFiles) {
				const type = ns.codingcontract.getContractType(cctFile, server.name)
				const data = ns.codingcontract.getData(cctFile, server.name)
				const { known, attempt, result } = evaluateCct(type, data)
				if (attempt) {
					const succeeded = ns.codingcontract.attempt(
						result,
						cctFile,
						server.name,
						{ returnReward: true }
					)
					if (succeeded) {
						ns.tprint(`\t✔ ${cctFile} – ${type}: ${succeeded}`)
					} else {
						ns.tprint(`\t❌ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
					}
				} else {
					if (known) {
						ns.tprint(`\t➖ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
						if (result) {
							ns.tprint(`\t\t${JSON.stringify(result)}`)
						}
					} else {
						ns.tprint(`\t❓ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
					}
				}
			}
		}
	}
}
