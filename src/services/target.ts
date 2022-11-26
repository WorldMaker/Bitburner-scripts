import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import {
	orderByDescending,
	thenByDescending,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { Target } from '../models/target.js'
import { Stats } from '../models/stats.js'

const { from } = IterableX

export class TargetService {
	private targets: Target[]

	constructor() {
		this.targets = []
	}

	getTopTarget() {
		return this.targets[0]
	}

	getTargets() {
		return this.targets
	}

	assessTargets(stats: Stats, rootedServers: Iterable<Target>) {
		this.targets = [
			...from(rootedServers).pipe(
				filter((server) => !server.purchased), // skip own servers
				filter((server) => server.getWorth() > 0), // skip servers with no money
				filter((server) => stats.isTargetHackable(server)),
				orderByDescending((server) => stats.getTargetEfficiency(server)),
				thenByDescending((server) => server.hackingLevel),
				thenByDescending((server) => server.name)
			),
		]
	}

	findTarget(stats: Stats, rootedServers: Iterable<Target>) {
		const previousTarget = this.getTopTarget()
		this.assessTargets(stats, rootedServers)
		return previousTarget !== this.getTopTarget()
	}
}
