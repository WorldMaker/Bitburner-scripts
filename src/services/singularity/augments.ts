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
	private augments: Iterable<AugmentInfo>

	constructor(private readonly ns: NS) {
		this.augments = from([])
	}

	getPriorities(): Iterable<AugmentInfo> {
		return this.augments
	}

	prioritize() {
		const ownedAugments = new Set(
			this.ns.singularity.getOwnedAugmentations(true)
		)
		this.augments = from(this.ns.getPlayer().factions).pipe(
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
			filter((augment) => !ownedAugments.has(augment.name)),
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
}
