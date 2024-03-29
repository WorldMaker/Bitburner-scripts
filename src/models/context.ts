import { NsLogger } from '../logging/logger'
import { ServerCacheService } from '../services/server-cache'
import { PlayerStats } from './stats'
import { Target, TargetFactory } from './targets'
import { ServerTarget, deployTargetFactory } from './targets/server-target'

const ConfigFileName = 'env.json.txt'

export class NsContext {
	cct = true
	hasPublicCompany = false
	hacknetNodes = 5
	hacknetHashStrategy = 'money'
	hacknetDeployThreshold = 200_000_000_000
	hackStrategy = 'formulated'
	flightController = true
	gangFaction = 'Slum Snakes'
	scanMaxDepth = 100
	shirtStrategy = 'heist'
	tail = true
	targetAugmentFaction?: string | null = null
	toyBudget = 0

	constructor(public readonly ns: NS, public readonly logger: NsLogger) {}

	reset() {
		this.hacknetNodes = 5
		this.hacknetHashStrategy = 'money'
		this.hackStrategy = 'formulated'
		this.flightController = true
		this.scanMaxDepth = 100
		this.shirtStrategy = 'heist'
		this.tail = true
		this.targetAugmentFaction = null
		this.toyBudget = 0
	}

	load() {
		const json = this.ns.read(ConfigFileName)
		const env: unknown = json && json !== '' ? JSON.parse(json) : null
		if (env && typeof env === 'object') {
			if ('cct' in env && typeof env.cct === 'boolean') {
				this.cct = env.cct
			}
			if ('hacknetNodes' in env && typeof env.hacknetNodes === 'number') {
				this.hacknetNodes = env.hacknetNodes
			}
			if (
				'hacknetHashStrategy' in env &&
				typeof env.hacknetHashStrategy === 'string'
			) {
				this.hacknetHashStrategy = env.hacknetHashStrategy
			}
			if (
				'hacknetDeployThreshold' in env &&
				typeof env.hacknetDeployThreshold === 'number'
			) {
				this.hacknetDeployThreshold = env.hacknetDeployThreshold
			}
			if ('hackStrategy' in env && typeof env.hackStrategy === 'string') {
				this.hackStrategy = env.hackStrategy
			}
			if (
				'flightController' in env &&
				typeof env.flightController === 'boolean'
			) {
				this.flightController = env.flightController
			}
			if ('gangFaction' in env && typeof env.gangFaction === 'string') {
				this.gangFaction = env.gangFaction
			}
			if ('scanMaxDepth' in env && typeof env.scanMaxDepth === 'number') {
				this.scanMaxDepth = env.scanMaxDepth
			}
			if ('shirtStrategy' in env && typeof env.shirtStrategy === 'string') {
				this.shirtStrategy = env.shirtStrategy
			}
			if ('tail' in env && typeof env.tail === 'boolean') {
				this.tail = env.tail
			}
			if (
				'targetAugmentFaction' in env &&
				(typeof env.targetAugmentFaction === 'string' ||
					env.targetAugmentFaction === null)
			) {
				this.targetAugmentFaction = env.targetAugmentFaction
			}
			if ('toyBudget' in env && typeof env.toyBudget === 'number') {
				this.toyBudget = env.toyBudget
			}
		}
	}

	save() {
		const {
			cct,
			hacknetNodes,
			hackStrategy,
			hacknetHashStrategy,
			hacknetDeployThreshold,
			flightController,
			gangFaction,
			scanMaxDepth,
			shirtStrategy,
			tail,
			targetAugmentFaction,
			toyBudget,
		} = this
		const env = {
			cct,
			hacknetNodes,
			hackStrategy,
			hacknetHashStrategy,
			hacknetDeployThreshold,
			flightController,
			gangFaction,
			scanMaxDepth,
			shirtStrategy,
			tail,
			targetAugmentFaction,
			toyBudget,
		}
		this.ns.write(ConfigFileName, JSON.stringify(env, null, '\t'), 'w')
	}
}

export class TargetContext<T extends Target> extends NsContext {
	public readonly servers: ServerCacheService<T>

	constructor(
		ns: NS,
		logger: NsLogger,
		public readonly targetFactory: TargetFactory<T>
	) {
		super(ns, logger)

		this.servers = new ServerCacheService(ns, targetFactory)
	}
}

export class DeploymentContext extends TargetContext<ServerTarget> {
	#stats: PlayerStats | null = null
	get stats(): PlayerStats {
		this.#stats ??= new PlayerStats(this.ns)
		return this.#stats
	}

	constructor(ns: NS, logger: NsLogger) {
		super(ns, logger, deployTargetFactory)
	}

	load() {
		this.#stats = new PlayerStats(this.ns)

		super.load()
	}
}
