const ConfigFileName = 'env.json.txt'

export class Config {
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

	constructor(private ns: NS) {}

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
