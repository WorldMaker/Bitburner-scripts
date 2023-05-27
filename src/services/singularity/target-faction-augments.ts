import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { NsContext } from '../../models/context'
import { ToyPurchaser } from '../../models/toys'
import { AugmentPrioritizer, NFG } from './augments'

const { from } = IterableX

type AcquisitionState = '🎯' | '🎊' | '💻'

const BonusTicks = 6 /* ~1 min */

export class TargetFactionAugmentsService {
	private state: AcquisitionState
	private ticks = 0

	constructor(
		private readonly context: NsContext,
		private readonly priorities: AugmentPrioritizer,
		private readonly finalToys: ToyPurchaser[]
	) {
		this.state = '🎯'
	}

	summarize() {
		const { logger } = this.context
		if (this.context.targetAugmentFaction) {
			switch (this.state) {
				case '🎯':
					logger.info`acquiring ${this.state} ${this.context.targetAugmentFaction} augments`
					break
				case '🎊':
					logger.info`acquiring ${this.state} bonus augments`
					break
				case '💻':
					logger.info`acquiring ${this.state} home improvements`
					break
			}
		}
	}

	async manage() {
		const faction = this.context.targetAugmentFaction

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
		const { ns, logger } = this.context
		const factionAugments = from(this.priorities.getPriorities()).pipe(
			filter((augment) => faction === 'all' || augment.faction === faction)
		)

		for (const augment of factionAugments) {
			if (augment.name === NFG) {
				// always a bonus aug
				continue
			}

			const { money } = ns.getPlayer()
			if (augment.cost > money) {
				logger.debug`Need more money for ${augment.name}: ${ns.formatNumber(
					money
				)} / ${ns.formatNumber(augment.cost)}`
				return
			}
			const factionRep = ns.singularity.getFactionRep(augment.faction)
			if (augment.rep > factionRep) {
				logger.debug`Need more rep for ${augment.name}: ${ns.formatNumber(
					factionRep
				)} / ${ns.formatNumber(augment.rep)}`
				return
			}
			logger.trace`buying ${augment.name}`
			if (!ns.singularity.purchaseAugmentation(augment.faction, augment.name)) {
				if (augment.prereq.size > 0) {
					for (const prereq of augment.prereq) {
						const augments = this.priorities.getAugment(prereq)
						if (augments) {
							for (const preregAugment of augments.values()) {
								if (
									ns.singularity.purchaseAugmentation(
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
				logger.warn`Unable to purchase ${augment.name}`
				return
			}
		}

		this.state = '🎊'
		this.ticks = 0
	}

	private async acquireBonusAugments() {
		const { ns, logger } = this.context
		let purchased = false

		for (const augment of this.priorities.getPriorities()) {
			const { money } = ns.getPlayer()
			const factionRep = ns.singularity.getFactionRep(augment.faction)
			if (augment.cost < money && augment.rep <= factionRep) {
				logger.trace`buying ${augment.name}`
				if (
					ns.singularity.purchaseAugmentation(augment.faction, augment.name)
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
		const { ns, logger } = this.context
		let purchased = false

		const { money } = ns.getPlayer()
		const ramUpgradeCost = ns.singularity.getUpgradeHomeRamCost()
		if (ramUpgradeCost < money) {
			logger.trace`buying home RAM upgrade`
			if (ns.singularity.upgradeHomeRam()) {
				purchased = true
				this.ticks = 0
				return
			}
		}

		const coresUpgradeCost = ns.singularity.getUpgradeHomeCoresCost()
		if (coresUpgradeCost < money) {
			logger.trace`buying home cores upgrade`
			if (ns.singularity.upgradeHomeCores()) {
				purchased = true
				this.ticks = 0
				return
			}
		}

		for (const purchaser of this.finalToys) {
			const remainingBudget = purchaser.purchase(money)
			if (remainingBudget < money) {
				purchased = true
				this.ticks = 0
				return
			}
		}

		if (!purchased && this.ticks > BonusTicks) {
			// clear target
			this.context.reset()
			this.context.save()

			logger.trace`installing`
			ns.singularity.installAugmentations(ns.getScriptName())
		}
	}
}
