import { Cooperative, evaluateCct } from '../cct'
import { TargetContext } from '../models/context'
import { Target } from '../models/targets'

const CooperativeThreadingTime = 1000 /* ms */

export class CctService<T extends Target> {
	private lastCooperative = Date.now()
	private skiplist = new Set<string>()

	private pending = 0
	private successes = 0
	private attempts = 0
	private unknowns = 0
	private skips = 0

	constructor(private readonly context: TargetContext<T>) {}

	readonly cooperative: Cooperative = async (summarize: () => string) => {
		const { ns, logger } = this.context
		const now = Date.now()
		if (now - this.lastCooperative >= CooperativeThreadingTime) {
			logger.log(summarize())
			await ns.sleep(Math.random() * 1000 /* ms */)
			this.lastCooperative = now
		}
	}

	summarize(force = false) {
		const { logger } = this.context
		if (!(this.context.cct || force)) {
			return
		}
		if (this.unknowns > 0 || this.skips > 0) {
			logger.info`${this.unknowns} unknown contracts; ${this.skips} skipped contracts`
		}
		if (this.pending > 0) {
			logger.info`${this.successes}/${this.attempts}/${this.pending} contracts completed`
		} else if (this.successes === this.attempts) {
			logger.success`${this.successes}/${this.attempts} contracts completed`
		} else {
			logger.warn`${this.successes}/${this.attempts} contracts completed`
		}
	}

	async manage(
		force = false,
		showSkippedResults = false,
		attemptAll = false,
		isolateType: string | null = null
	) {
		if (!(this.context.cct || force)) {
			return
		}

		const { ns, logger, servers } = this.context

		this.pending = 0
		this.unknowns = 0
		this.skips = 0

		let attempted = false

		for (const server of servers.values()) {
			const cctFiles = ns.ls(server.name, '.cct')
			if (cctFiles.length) {
				logger.trace`${cctFiles.length} cct files on ${server.name}`

				for (const cctFile of cctFiles) {
					const type = ns.codingcontract.getContractType(cctFile, server.name)
					const data = ns.codingcontract.getData(cctFile, server.name)
					const { known, attempt, solver } = evaluateCct(
						type,
						data,
						this.cooperative,
						logger.getLogger(),
						this.skiplist,
						force
					)
					if (
						(!isolateType || isolateType === type) &&
						(attempt || (known && force))
					) {
						if (attemptAll || !attempted) {
							attempted = true
							this.attempts++
							let succeeded: string | boolean = false
							logger.debug`\t⚒ ${cctFile} – ${type}: ${JSON.stringify(data)}`
							await ns.sleep(50) // tiny sleep to make sure above log is presented
							try {
								succeeded = ns.codingcontract.attempt(
									await solver(),
									cctFile,
									server.name
								)
							} catch (err) {
								logger.error`Error solving ${type}: ${err}`
							}
							if (succeeded) {
								this.successes++
								logger.display(
									`\t✔ ${server.name}\t${cctFile} – ${type}: ${succeeded}`
								)
							} else {
								logger.display(
									`\t❌ ${server.name}\t${cctFile} – ${type}: ${JSON.stringify(
										data
									)}`
								)
								this.skiplist.add(type)
							}

							// add a tiny pause for the game's sake to keep from locking the terminal on long solutions
							await this.cooperative(
								() => `attempted contract on ${server.name}`
							)
						} else {
							this.pending++
							logger.log(`\t⌛ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
						}
					} else {
						if (known) {
							this.skips++
							logger.log(`\t➖ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
							if (showSkippedResults) {
								logger.log(`\t\t${JSON.stringify(await solver())}`)
							}
						} else {
							this.unknowns++
							logger.log(`\t❓ ${cctFile} – ${type}: ${JSON.stringify(data)}`)
						}
					}
				}
			}
		}
	}
}
