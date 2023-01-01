import { evaluateCct } from './cct'
import { NsLogger } from './logging/logger'
import { simpleTargetFactory } from './models/target'
import { ScannerService } from './services/scanner'
import { ServerCacheService } from './services/server-cache'

export const CooperativeThreadingTime = 1000 /* ms */

let running = false

export async function main(ns: NS) {
	const [command, rawDepth] = ns.args

	let force = false
	const depth = Number(rawDepth) ?? 100

	let runonce = false
	let showSkippedResults = false

	if (command) {
		switch (command) {
			case 'stop':
				running = false
				return

			case 'start':
				running = false
				ns.tail()
				break

			case 'force':
				runonce = true
				force = true
				break

			case 'run':
				runonce = true
				showSkippedResults = true
				break

			default:
				ns.tprint(`WARN Unknown command ${command}`)
				break
		}
	}

	if (!runonce) {
		if (running) {
			return
		}

		running = true
	}

	const logger = new NsLogger(ns, runonce)
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

	let successes = 0
	let attempts = 0
	let ran = false

	while ((runonce && !ran) || (!runonce && running)) {
		ran = true

		scannerService.scan()

		let unknowns = 0
		let skips = 0

		for (const server of servers.values()) {
			const cctFiles = ns.ls(server.name, '.cct')
			if (cctFiles.length) {
				logger.log(server.name)
				for (const cctFile of cctFiles) {
					const type = ns.codingcontract.getContractType(cctFile, server.name)
					const data = ns.codingcontract.getData(cctFile, server.name)
					const { known, attempt, solver } = evaluateCct(
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
							await solver(),
							cctFile,
							server.name,
							{ returnReward: true }
						)
						if (succeeded) {
							successes++
							logger.display(
								`\t✔ ${server.name}\t${cctFile} – ${type}: ${succeeded}`
							)
						} else {
							logger.display(
								`\t❌ ${server.name}\t${cctFile} – ${type}: ${JSON.stringify(
									data
								)}`
							)
							skiplist.add(type)
						}

						// add a tiny pause for the game's sake to keep from locking the terminal on long solutions
						await cooperative(() => `attempting contracts on ${server.name}`)
					} else {
						if (known) {
							skips++
							logger.log(`\t➖ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
							if (showSkippedResults) {
								logger.log(`\t\t${JSON.stringify(await solver())}`)
							}
						} else {
							unknowns++
							logger.log(`\t❓ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
						}
					}
				}
			}
		}

		if (unknowns > 0 || skips > 0) {
			logger.info`${unknowns} unknown contracts; ${skips} skipped contracts`
		}
		if (successes === attempts) {
			logger.success`${successes}/${attempts} contracts completed`
		} else {
			logger.warn`${successes}/${attempts} contracts completed`
		}

		await ns.sleep(10 /* s */ * 1000 /* ms */)
	}
}
