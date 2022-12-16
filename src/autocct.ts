import { evaluateCct } from './cct'
import { NsLogger } from './logging/logger'
import { simpleTargetFactory } from './models/target'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

export async function main(ns: NS) {
	const [command, rawDepth] = ns.args

	const force = command === 'force'
	const depth = Number(rawDepth) ?? 100

	const logger = new NsLogger(ns)
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
			logger.display(server.name)
			for (const cctFile of cctFiles) {
				const type = ns.codingcontract.getContractType(cctFile, server.name)
				const data = ns.codingcontract.getData(cctFile, server.name)
				const { known, attempt, result } = evaluateCct(
					type,
					data,
					logger.getLogger(),
					force
				)
				if (attempt || (known && force)) {
					const succeeded = ns.codingcontract.attempt(
						result,
						cctFile,
						server.name,
						{ returnReward: true }
					)
					if (succeeded) {
						logger.display(`\t✔ ${cctFile} – ${type}: ${succeeded}`)
					} else {
						logger.display(`\t❌ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
					}
				} else {
					if (known) {
						logger.display(`\t➖ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
						if (result) {
							logger.display(`\t\t${JSON.stringify(result)}`)
						}
					} else {
						logger.display(`\t❓ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
					}
				}

				// add a tiny pause for the game's sake to keep from locking the terminal on long solutions
				await ns.sleep(20 /* ms */)
			}
		}
	}
}
