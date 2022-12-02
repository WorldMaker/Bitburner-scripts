import { DeployTarget } from './deploy-target'

export interface Target extends DeployTarget {
	readonly hackingLevel: number
	readonly purchasedNumber: number | null
	readonly purchased: boolean
	getServer(): Server
	getHackingPorts(): number
	getMaxRam(): number
	getRooted(): boolean
	checkRooted(): boolean
	checkUsedRam(): number
}
