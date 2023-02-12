import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { flatMap } from '@reactivex/ix-esnext-esm/iterable/operators/flatmap'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import {
	orderBy,
	thenByDescending,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'

const { from } = IterableX

export interface AugmentInfo {
	faction: string
	name: string
	cost: number
	rep: number
	prereq: Set<string>
}

export class AugmentPrioritizer {
	private augmentsByNameThenFaction = new Map<
		string,
		Map<string, AugmentInfo>
	>()

	constructor(private readonly ns: NS) {}

	getPriorities(): Iterable<AugmentInfo> {
		return from(this.augmentsByNameThenFaction.values()).pipe(
			flatMap((augments) => augments.values()),
			orderBy(
				(augment) => augment,
				(a, b) => {
					if (a.prereq.has(b.name)) {
						return 1 // a after b
					} else if (b.prereq.has(a.name)) {
						return -1 // b before a
					} else {
						return 0 // order doesn't matter ("equal")
					}
				}
			),
			thenByDescending((augment) => augment.cost)
		)
	}

	getAugment(name: string) {
		return this.augmentsByNameThenFaction.get(name)
	}

	prioritize() {
		const ownedAugments = new Set(
			this.ns.singularity.getOwnedAugmentations(true)
		)

		for (const augment of ownedAugments) {
			this.augmentsByNameThenFaction.delete(augment)
		}

		const augments = from(this.ns.getPlayer().factions).pipe(
			flatMap((faction) =>
				from(this.ns.singularity.getAugmentationsFromFaction(faction)).pipe(
					filter((name) => !ownedAugments.has(name)),
					map((name) => ({
						faction,
						name,
						cost: this.ns.singularity.getAugmentationPrice(name),
						rep: this.ns.singularity.getAugmentationRepReq(name),
						prereq: new Set(this.ns.singularity.getAugmentationPrereq(name)),
					}))
				)
			),
			filter((augment) => !ownedAugments.has(augment.name))
		)

		for (const augment of augments) {
			const augments =
				this.augmentsByNameThenFaction.get(augment.name) ??
				new Map<string, AugmentInfo>()
			augments.set(augment.faction, augment)
			this.augmentsByNameThenFaction.set(augment.name, augments)
		}
	}
}
