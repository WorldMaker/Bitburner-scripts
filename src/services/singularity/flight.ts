import { NsContext } from '../../models/context'
import { AugmentPrioritizer, NFG } from './augments'

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
		private readonly context: NsContext,
		private readonly augmentPrioritizer: AugmentPrioritizer
	) {}

	summarize() {
		const { logger } = this.context
		if (
			this.context.flightController &&
			(this.#factionsComplete < FlightPlan.length ||
				this.#programsComplete < Programs.length)
		) {
			logger.info`monitoring ✈ flight plan; ${this.#factionsComplete}/${
				FlightPlan.length
			}, ${this.#programsComplete}/${Programs.length}`
		}
	}

	manage() {
		const { ns, logger } = this.context

		if (!this.context.flightController) {
			return
		}

		// accept all faction invites
		const invites = ns.singularity.checkFactionInvitations()
		for (const invite of invites) {
			if (!ns.singularity.joinFaction(invite)) {
				logger.warn`could not join ${invite}`
			} else {
				// reprioritize augments when accepting invites
				this.augmentPrioritizer.prioritize()
			}
		}

		// determine current flight plan faction
		this.#factionsComplete = 0
		const player = ns.getPlayer()
		const factions = new Set(player.factions)
		let current = ''
		let currentAugments: string[] = []
		const owned = new Set(ns.singularity.getOwnedAugmentations(true))
		for (const plan of FlightPlan) {
			if (!factions.has(plan)) {
				logger.trace`not invited to ${plan} yet`
				continue
			}
			const augments = ns.singularity
				.getAugmentationsFromFaction(plan)
				.filter((augment) => !owned.has(augment))
			if (!augments.length) {
				logger.trace`${plan} has no augments remaining`
				this.#factionsComplete++
				continue
			}
			if (augments.length === 1 && augments[0].startsWith(NFG)) {
				logger.trace`${plan} has only NFG remaining`
				this.#factionsComplete++
				continue
			}
			logger.trace`${plan} needs augments ${augments}`
			if (current === '') {
				current = plan
				currentAugments = augments
				if (this.context.targetAugmentFaction !== current) {
					this.context.targetAugmentFaction = current
				}
			}
		}

		// *** Work management ***

		const work = ns.singularity.getCurrentWork()
		const workType = work?.type

		// create any missing programs
		this.#programsComplete = 0
		let startedCreation = false
		for (const [program, level] of Programs) {
			if (ns.fileExists(program)) {
				this.#programsComplete++
				continue
			}
			if (
				workType !== 'CREATE_PROGRAM' &&
				!startedCreation &&
				player.skills.hacking >= level
			) {
				startedCreation ||= ns.singularity.createProgram(program, true)
			}
		}

		if (startedCreation || workType === 'CREATE_PROGRAM') {
			return
		}

		// build any necessary faction rep
		if (current.length) {
			const maxRepNeeded = currentAugments.reduce(
				(acc, cur) => Math.max(acc, ns.singularity.getAugmentationRepReq(cur)),
				0
			)
			const repNeeded = maxRepNeeded - ns.singularity.getFactionRep(current)
			if (repNeeded > 0) {
				if (workType !== 'FACTION' || work?.factionName !== current) {
					ns.singularity.workForFaction(current, 'hacking', true)
				}
				return
			}
		}

		if (workType === 'CRIME') {
			return
		}

		// fall back to a life of crime
		ns.singularity.commitCrime('Heist', true)
	}
}
