import { Cooperative, evaluateCct } from '../cct'
import { NsLogger } from '../logging/logger'
import { Config } from '../models/config'
import { Target } from '../models/targets'
import { ServerCacheService } from './server-cache'

const CooperativeThreadingTime = 1000 /* ms */

export class CctService<T extends Target> {
	private lastCooperative = Date.now()
	private skiplist = new Set<string>()

	private pending = 0
	private successes = 0
	private attempts = 0
	private unknowns = 0
	private skips = 0

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly servers: ServerCacheService<T>,
		private readonly logger: NsLogger
	) {}

	readonly cooperative: Cooperative = async (summarize: () => string) => {
		const now = Date.now()
		if (now - this.lastCooperative >= CooperativeThreadingTime) {
			this.logger.log(summarize())
			await this.ns.sleep(Math.random() * 1000 /* ms */)
			this.lastCooperative = now
		}
	}

	summarize() {
		if (!this.config.cct) {
			return
		}
		if (this.unknowns > 0 || this.skips > 0) {
			this.logger
				.info`${this.unknowns} unknown contracts; ${this.skips} skipped contracts`
		}
		if (this.pending > 0) {
			this.logger
				.info`${this.successes}/${this.attempts}/${this.pending} contracts completed`
		} else if (this.successes === this.attempts) {
			this.logger
				.success`${this.successes}/${this.attempts} contracts completed`
		} else {
			this.logger.warn`${this.successes}/${this.attempts} contracts completed`
		}
	}

	async manage(
		force = false,
		showSkippedResults = false,
		attemptAll = false,
		isolateType: string | null = null
	) {
		if (!(this.config.cct || force)) {
			return
		}

		this.pending = 0
		this.unknowns = 0
		this.skips = 0

		let attempted = false

		for (const server of this.servers.values()) {
			const cctFiles = this.ns.ls(server.name, '.cct')
			if (cctFiles.length) {
				this.logger.trace`${cctFiles.length} cct files on ${server.name}`

				for (const cctFile of cctFiles) {
					const type = this.ns.codingcontract.getContractType(
						cctFile,
						server.name
					)
					const data = this.ns.codingcontract.getData(cctFile, server.name)
					const { known, attempt, solver } = evaluateCct(
						type,
						data,
						this.cooperative,
						this.logger.getLogger(),
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
							this.logger.debug`\t⚒ ${cctFile} – ${type}: ${JSON.stringify(
								data
							)}`
							await this.ns.sleep(50) // tiny sleep to make sure above log is presented
							try {
								succeeded = this.ns.codingcontract.attempt(
									await solver(),
									cctFile,
									server.name
								)
							} catch (err) {
								this.logger.error`Error solving ${type}: ${err}`
							}
							if (succeeded) {
								this.successes++
								this.logger.display(
									`\t✔ ${server.name}\t${cctFile} – ${type}: ${succeeded}`
								)
							} else {
								this.logger.display(
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
							this.logger.log(
								`\t⌛ ${cctFile} – ${type}: ${JSON.stringify(data)}`
							)
						}
					} else {
						if (known) {
							this.skips++
							this.logger.log(
								`\t➖ ${cctFile} – ${type}: ${JSON.stringify(data)}`
							)
							if (showSkippedResults) {
								this.logger.log(`\t\t${JSON.stringify(await solver())}`)
							}
						} else {
							this.unknowns++
							this.logger.log(
								`\t❓ ${cctFile} – ${type}: ${JSON.stringify(data)}`
							)
						}
					}
				}
			}
		}
	}
}
