import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import {
	orderByDescending,
	thenByDescending,
} from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { ServerTarget } from '../models/targets/server-target'
import { PlayerStats } from '../models/stats'

const { from } = IterableX

export class TargetService {
	private targets: ServerTarget[]

	constructor() {
		this.targets = []
	}

	getTopTarget() {
		return this.targets[0]
	}

	getTargets() {
		return this.targets
	}

	assessTargets(stats: PlayerStats, rootedServers: Iterable<ServerTarget>) {
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

	findTarget(stats: PlayerStats, rootedServers: Iterable<ServerTarget>) {
		const previousTarget = this.getTopTarget()
		this.assessTargets(stats, rootedServers)
		return previousTarget !== this.getTopTarget()
	}
}
