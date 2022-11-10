import { DeployTarget } from './deploy-target'

export interface Target extends DeployTarget {
	readonly hackingLevel: number
	readonly purchasedNumber: number | null
	readonly isSlow: boolean
	readonly purchased: boolean
	getHackingPorts(): number
	getMaxRam(): number
	getRooted(): boolean
	checkRooted(): boolean
	checkUsedRam(): number
}
