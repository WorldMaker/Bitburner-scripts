const ConfigFileName = 'env.json.txt'

export class Config {
	hacknetNodes = 5
	hacknetHashStrategy = 'money'
	hackStrategy = 'formulated'
	flightController = true
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
			if ('hackStrategy' in env && typeof env.hackStrategy === 'string') {
				this.hackStrategy = env.hackStrategy
			}
			if (
				'flightController' in env &&
				typeof env.flightController === 'boolean'
			) {
				this.flightController = env.flightController
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
			flightController,
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
			flightController,
			scanMaxDepth,
			shirtStrategy,
			tail,
			targetAugmentFaction,
			toyBudget,
		}
		this.ns.write(ConfigFileName, JSON.stringify(env), 'w')
	}
}
