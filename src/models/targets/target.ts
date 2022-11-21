import { DeployTarget } from './deploy-target'

export interface Target extends DeployTarget {
	readonly hackingLevel: number
	readonly purchasedNumber: number | null
	readonly purchased: boolean
	getHackingPorts(): number
	getMaxRam(): number
	getRooted(): boolean
	checkRooted(): boolean
	checkUsedRam(): number
	addParent(name: string): void
	getParents(): Iterable<string>
}
