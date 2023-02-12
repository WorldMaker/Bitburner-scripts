import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { AugmentPrioritizer } from './augments'

const { from } = IterableX

type AcquisitionState = '🎯' | '🎊' | '💻'

const BonusTicks = 6 /* ~1 min */

export class TargetFactionAugmentsService {
	private state: AcquisitionState
	private ticks = 0

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger,
		private readonly priorities: AugmentPrioritizer
	) {
		this.state = '🎯'
	}

	summarize() {
		if (this.config.targetAugmentFaction) {
			switch (this.state) {
				case '🎯':
					this.logger
						.info`acquiring ${this.state} ${this.config.targetAugmentFaction} augments`
					break
				case '🎊':
					this.logger.info`acquiring ${this.state} bonus augments`
					break
				case '💻':
					this.logger.info`acquiring ${this.state} home improvements`
					break
			}
		}
	}

	async manage() {
		const faction = this.config.targetAugmentFaction

		if (!faction) {
			this.state = '🎯'
			this.ticks = 0
			return
		}

		switch (this.state) {
			case '🎯':
				await this.acquireTargetAugments(faction)
				break
			case '🎊':
				await this.acquireBonusAugments()
				break
			case '💻':
				await this.purchaseHomeImprovements()
				break
		}

		this.ticks++
	}

	private async acquireTargetAugments(faction: string) {
		const factionAugments = from(this.priorities.getPriorities()).pipe(
			filter((augment) => faction === 'all' || augment.faction === faction)
		)

		for (const augment of factionAugments) {
			const { money } = this.ns.getPlayer()
			if (augment.cost > money) {
				this.logger.debug`Need more money for ${
					augment.name
				}: ${this.ns.nFormat(money, '0.00a')} / ${this.ns.nFormat(
					augment.cost,
					'0.00a'
				)}`
				return
			}
			const factionRep = this.ns.singularity.getFactionRep(augment.faction)
			if (augment.rep > factionRep) {
				this.logger.debug`Need more rep for ${augment.name}: ${this.ns.nFormat(
					factionRep,
					'0.00a'
				)} / ${this.ns.nFormat(augment.rep, '0.00a')}`
				return
			}
			this.logger.trace`buying ${augment.name}`
			if (
				!this.ns.singularity.purchaseAugmentation(augment.faction, augment.name)
			) {
				if (augment.prereq.size > 0) {
					for (const prereq of augment.prereq) {
						const augments = this.priorities.getAugment(prereq)
						if (augments) {
							for (const preregAugment of augments.values()) {
								if (
									this.ns.singularity.purchaseAugmentation(
										preregAugment.faction,
										preregAugment.name
									)
								) {
									return
								}
							}
						}
					}
				}
				this.logger.warn`Unable to purchase ${augment.name}`
				return
			}
		}

		this.state = '🎊'
		this.ticks = 0
	}

	private async acquireBonusAugments() {
		let purchased = false

		for (const augment of this.priorities.getPriorities()) {
			const { money } = this.ns.getPlayer()
			const factionRep = this.ns.singularity.getFactionRep(augment.faction)
			if (augment.cost < money && augment.rep < factionRep) {
				this.logger.trace`buying ${augment.name}`
				if (
					this.ns.singularity.purchaseAugmentation(
						augment.faction,
						augment.name
					)
				) {
					purchased = true
					this.ticks = 0
					return
				}
			}
		}

		if (!purchased && this.ticks > BonusTicks) {
			this.state = '💻'
			this.ticks = 0
		}
	}

	private async purchaseHomeImprovements() {
		let purchased = false

		const { money } = this.ns.getPlayer()
		const ramUpgradeCost = this.ns.singularity.getUpgradeHomeRamCost()
		if (ramUpgradeCost < money) {
			this.logger.trace`buying home RAM upgrade`
			if (this.ns.singularity.upgradeHomeRam()) {
				purchased = true
				this.ticks = 0
				return
			}
		}

		const coresUpgradeCost = this.ns.singularity.getUpgradeHomeCoresCost()
		if (coresUpgradeCost < money) {
			this.logger.trace`buying home cores upgrade`
			if (this.ns.singularity.upgradeHomeCores()) {
				purchased = true
				this.ticks = 0
				return
			}
		}

		if (!purchased && this.ticks > BonusTicks) {
			// clear target
			this.config.targetAugmentFaction = null
			this.config.save()

			this.logger.trace`installing`
			this.ns.singularity.installAugmentations(this.ns.getScriptName())
		}
	}
}
