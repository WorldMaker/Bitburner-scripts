import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { NsLogger } from './logging/logger'
import { AugmentPrioritizer } from './services/singularity/augments'

const { from } = IterableX

export async function main(ns: NS) {
	const logger = new NsLogger(ns, true)
	const augmentPrioritizer = new AugmentPrioritizer(ns)

	const faction = ns.args[0].toString()

	augmentPrioritizer.prioritize()

	// *** Buy all of a single faction's augments ***
	const factionAugments = from(augmentPrioritizer.getPriorities()).pipe(
		filter((augment) => augment.faction === faction)
	)

	for (const augment of factionAugments) {
		const { money } = ns.getPlayer()
		if (augment.cost > money) {
			logger.warn`Need more money for ${augment.name}: ${money}/${augment.cost}`
			return
		}
		const factionRep = ns.singularity.getFactionRep(augment.faction)
		if (augment.rep > factionRep) {
			logger.warn`Need more rep for ${augment.name}: ${factionRep}/${augment.rep}`
			return
		}
		logger.trace`buying ${augment.name}`
		if (!ns.singularity.purchaseAugmentation(augment.faction, augment.name)) {
			logger.warn`Unable to purchase ${augment.name}`
			return
		}
		await ns.sleep(1 /* s */ * 1000 /* ms */)
	}

	// *** Bonus augments ***
	let purchased = true
	while (purchased) {
		purchased = false
		augmentPrioritizer.prioritize()

		for (const augment of augmentPrioritizer.getPriorities()) {
			const { money } = ns.getPlayer()
			const factionRep = ns.singularity.getFactionRep(augment.faction)
			if (augment.cost < money && augment.rep < factionRep) {
				logger.trace`buying ${augment.name}`
				if (
					ns.singularity.purchaseAugmentation(augment.faction, augment.name)
				) {
					purchased = true
				}
			}
		}

		await ns.sleep(1 /* s */ * 1000 /* ms */)
	}

	// *** Home upgrades ***
	purchased = true
	while (purchased) {
		purchased = false
		const { money } = ns.getPlayer()
		const ramUpgradeCost = ns.singularity.getUpgradeHomeRamCost()
		if (ramUpgradeCost < money) {
			logger.trace`buying home RAM upgrade`
			if (ns.singularity.upgradeHomeRam()) {
				purchased = true
				await ns.sleep(1 /* s */ * 1000 /* ms */)
				continue
			}
		}

		const coresUpgradeCost = ns.singularity.getUpgradeHomeCoresCost()
		if (coresUpgradeCost < money) {
			logger.trace`buying home cores upgrade`
			if (ns.singularity.upgradeHomeCores()) {
				purchased = true
				await ns.sleep(1 /* s */ * 1000 /* ms */)
				continue
			}
		}
	}

	logger.trace`installing`
	ns.singularity.installAugmentations()
}
