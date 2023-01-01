import { evaluateCct } from './cct'
import { NsLogger } from './logging/logger'
import { simpleTargetFactory } from './models/target'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

export const CooperativeThreadingTime = 1000 /* ms */

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
	const skiplist = new Set<string>()

	let lastCooperative = performance.now()
	const cooperative = async (summarize: () => string) => {
		const now = performance.now()
		if (now - lastCooperative >= CooperativeThreadingTime) {
			logger.log(summarize())
			await ns.sleep(Math.random() * 1000 /* ms */)
			lastCooperative = now
		}
	}

	scannerService.scan()

	let successes = 0
	let attempts = 0
	let unknowns = 0
	let skips = 0

	for (const server of servers.values()) {
		const cctFiles = ns.ls(server.name, '.cct')
		if (cctFiles.length) {
			logger.display(server.name)
			for (const cctFile of cctFiles) {
				const type = ns.codingcontract.getContractType(cctFile, server.name)
				const data = ns.codingcontract.getData(cctFile, server.name)
				const { known, attempt, result } = await evaluateCct(
					type,
					data,
					cooperative,
					logger.getLogger(),
					skiplist,
					force
				)
				if (attempt || (known && force)) {
					attempts++
					const succeeded = ns.codingcontract.attempt(
						result,
						cctFile,
						server.name,
						{ returnReward: true }
					)
					if (succeeded) {
						successes++
						logger.display(`\t✔ ${cctFile} – ${type}: ${succeeded}`)
					} else {
						logger.display(`\t❌ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
						skiplist.add(type)
					}

					// add a tiny pause for the game's sake to keep from locking the terminal on long solutions
					await ns.sleep(20 /* ms */)
				} else {
					if (known) {
						skips++
						logger.display(`\t➖ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
						if (result) {
							logger.display(`\t\t${JSON.stringify(result)}`)
						}
					} else {
						unknowns++
						logger.display(`\t❓ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
					}
				}
			}
		}
	}

	if (unknowns > 0 || skips > 0) {
		logger.display(
			`INFO ${unknowns} unknown contracts; ${skips} skipped contracts`
		)
	}
	if (successes === attempts) {
		logger.display(`SUCCESS ${successes}/${attempts} contracts completed`)
	} else {
		logger.display(`WARN ${successes}/${attempts} contracts completed`)
	}
}
