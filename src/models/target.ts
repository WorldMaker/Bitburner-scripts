import { Target } from './targets/target.js'

export type TargetFactory = (
	ns: NS,
	name: string,
	purchased?: boolean
) => Target

export * from './targets/target.js'
export * from './targets/deploy-target.js'
export * from './targets/target.js'
export * from './targets/lazy-target.js'
export * from './targets/server-target.js'
