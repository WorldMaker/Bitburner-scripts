const ConfigFileName = 'env.json.txt'

export class Config {
	hacknetNodes = 5
	hackStrategy = 'formulated'
	flightController = false
	scanMaxDepth = 100
	shirtStrategy = 'heist'
	tail = true
	targetAugmentFaction?: string | null = null

	constructor(private ns: NS) {}

	load() {
		const json = this.ns.read(ConfigFileName)
		const env: unknown = json && json !== '' ? JSON.parse(json) : null
		if (env && typeof env === 'object') {
			if ('hacknetNodes' in env && typeof env.hacknetNodes === 'number') {
				this.hacknetNodes = env.hacknetNodes
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
		}
	}

	save() {
		const {
			hacknetNodes,
			hackStrategy,
			flightController,
			scanMaxDepth,
			shirtStrategy,
			tail,
			targetAugmentFaction,
		} = this
		const env = {
			hacknetNodes,
			hackStrategy,
			flightController,
			scanMaxDepth,
			shirtStrategy,
			tail,
			targetAugmentFaction,
		}
		this.ns.write(ConfigFileName, JSON.stringify(env), 'w')
	}
}
