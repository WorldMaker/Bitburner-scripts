import { from } from 'ix/iterable'
import {
	filter,
	orderByDescending,
	thenByDescending,
} from 'ix/iterable/operators'
import { Server } from '../models/server.js'
import { Stats } from '../models/stats.js'

export class TargetService {
	private targets: Server[]

	constructor(startingTarget: Server) {
		this.targets = [startingTarget]
	}

	getTopTarget() {
		return this.targets[0]
	}

	getTargets() {
		return this.targets
	}

	assessTargets(stats: Stats, rootedServers: Iterable<Server>) {
		this.targets = [
			...from(rootedServers).pipe(
				filter((server) => !server.purchased), // skip own servers
				filter(
					(server) => server.hackingLevel >= stats.getTargetHackingLevel()
				),
				orderByDescending((server) => server.getWorth()),
				thenByDescending((server) => server.hackingLevel),
				thenByDescending((server) => server.name)
			),
		]
	}

	findTarget(stats: Stats, rootedServers: Iterable<Server>) {
		const previousTarget = this.getTopTarget()
		this.assessTargets(stats, rootedServers)
		return previousTarget !== this.getTopTarget()
	}
}
