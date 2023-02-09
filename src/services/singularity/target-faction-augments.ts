import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { AugmentPrioritizer } from './augments'

const { from } = IterableX

export class TargetFactionAugmentsService {
	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger,
		private readonly priorities: AugmentPrioritizer
	) {}

	summarize() {
		if (this.config.targetAugmentFaction) {
			this.logger.info`acquiring ${this.config.targetAugmentFaction} augments`
		}
	}

	async manage() {
		const faction = this.config.targetAugmentFaction

		if (!faction) {
			return
		}

		// *** Buy all of a single faction's augments ***
		const factionAugments = from(this.priorities.getPriorities()).pipe(
			filter((augment) => augment.faction === faction)
		)

		for (const augment of factionAugments) {
			const { money } = this.ns.getPlayer()
			if (augment.cost > money) {
				this.logger
					.debug`Need more money for ${augment.name}: ${money}/${augment.cost}`
				return
			}
			const factionRep = this.ns.singularity.getFactionRep(augment.faction)
			if (augment.rep > factionRep) {
				this.logger
					.debug`Need more rep for ${augment.name}: ${factionRep}/${augment.rep}`
				return
			}
			this.logger.trace`buying ${augment.name}`
			if (
				!this.ns.singularity.purchaseAugmentation(augment.faction, augment.name)
			) {
				this.logger.warn`Unable to purchase ${augment.name}`
				return
			}
			await this.ns.sleep(1 /* s */ * 1000 /* ms */)
		}

		// *** Bonus augments ***
		let purchased = true
		while (purchased) {
			purchased = false
			this.priorities.prioritize()

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
					}
				}
			}

			await this.ns.sleep(1 /* s */ * 1000 /* ms */)
		}

		// *** Home upgrades ***
		purchased = true
		while (purchased) {
			purchased = false
			const { money } = this.ns.getPlayer()
			const ramUpgradeCost = this.ns.singularity.getUpgradeHomeRamCost()
			if (ramUpgradeCost < money) {
				this.logger.trace`buying home RAM upgrade`
				if (this.ns.singularity.upgradeHomeRam()) {
					purchased = true
					await this.ns.sleep(1 /* s */ * 1000 /* ms */)
					continue
				}
			}

			const coresUpgradeCost = this.ns.singularity.getUpgradeHomeCoresCost()
			if (coresUpgradeCost < money) {
				this.logger.trace`buying home cores upgrade`
				if (this.ns.singularity.upgradeHomeCores()) {
					purchased = true
					await this.ns.sleep(1 /* s */ * 1000 /* ms */)
					continue
				}
			}
		}

		// clear target
		this.config.targetAugmentFaction = null
		this.config.save()

		this.logger.trace`installing`
		this.ns.singularity.installAugmentations(this.ns.getScriptName())
	}
}
