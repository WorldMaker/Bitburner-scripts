import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { NFG } from './augments'

const FlightPlan = [
	'CyberSec',
	'NiteSec',
	'The Black Hand',
	'BitRunners',
	'Daedalus',
]

const Programs: [string, number][] = [
	['BruteSSH.exe', 50],
	['FTPCrack.exe', 100],
	['relaySMTP.exe', 250],
	['HTTPWorm.exe', 500],
	['SQLInject.exe', 750],
	['AutoLink.exe', 25],
	['ServerProfiler.exe', 75],
	['DeepscanV1.exe', 75],
	['DeepscanV2.exe', 400],
]

export class FlightController {
	#factionsComplete = 0
	#programsComplete = 0

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger
	) {}

	summarize() {
		if (
			this.config.flightController &&
			(this.#factionsComplete < FlightPlan.length ||
				this.#programsComplete < Programs.length)
		) {
			this.logger.info`monitoring ✈ flight plan; ${this.#factionsComplete}/${
				FlightPlan.length
			}; ${this.#programsComplete}/${Programs.length}`
		}
	}

	manage() {
		if (!this.config.flightController) {
			return
		}

		// accept all faction invites
		const invites = this.ns.singularity.checkFactionInvitations()
		for (const invite of invites) {
			if (!this.ns.singularity.joinFaction(invite)) {
				this.logger.warn`could not join ${invite}`
			}
		}

		// determine current flight plan faction
		this.#factionsComplete = 0
		const player = this.ns.getPlayer()
		const factions = new Set(player.factions)
		let current = ''
		let currentAugments: string[] = []
		const owned = new Set(this.ns.singularity.getOwnedAugmentations(true))
		for (const plan of FlightPlan) {
			if (!factions.has(plan)) {
				this.logger.trace`not invited to ${plan} yet`
				continue
			}
			const augments = this.ns.singularity
				.getAugmentationsFromFaction(plan)
				.filter((augment) => !owned.has(augment))
			if (!augments.length) {
				this.logger.trace`${plan} has no augments remaining`
				this.#factionsComplete++
				continue
			}
			if (augments.length === 1 && augments[0].startsWith(NFG)) {
				this.logger.trace`${plan} has only NFG remaining`
				this.#factionsComplete++
				continue
			}
			this.logger.trace`${plan} needs augments ${augments}`
			if (current === '') {
				current = plan
				currentAugments = augments
				if (this.config.targetAugmentFaction !== current) {
					this.config.targetAugmentFaction = current
				}
			}
		}

		// *** Work management ***

		const work = this.ns.singularity.getCurrentWork()
		const workType = work?.type

		// create any missing programs
		this.#programsComplete = 0
		let startedCreation = false
		for (const [program, level] of Programs) {
			if (this.ns.fileExists(program)) {
				this.#programsComplete++
				continue
			}
			if (
				workType !== 'CREATE_PROGRAM' &&
				!startedCreation &&
				player.skills.hacking >= level
			) {
				startedCreation ||= this.ns.singularity.createProgram(program, true)
			}
		}

		if (startedCreation || workType === 'CREATE_PROGRAM') {
			return
		}

		if (workType === 'FACTION') {
			return
		}

		// build any necessary faction rep
		const repNeeded = currentAugments.reduce(
			(acc, cur) =>
				Math.max(acc, this.ns.singularity.getAugmentationRepReq(cur)),
			0
		)
		if (repNeeded > 0) {
			this.ns.singularity.workForFaction(current, 'hacking', true)
			return
		}

		if (workType === 'CRIME') {
			return
		}

		// fall back to a life of crime
		this.ns.singularity.commitCrime('Heist', true)
	}
}
