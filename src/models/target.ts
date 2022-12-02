import { LazyTarget } from './targets/lazy-target.js'
import { Target } from './targets/target.js'

export type TargetFactory = (
	ns: NS,
	name: string,
	purchased?: boolean
) => Target

export const simpleTargetFactory: TargetFactory = (
	ns: NS,
	name: string,
	purchased?: boolean
) => new Target(ns, name, Infinity, purchased)

export const deployTargetFactory: TargetFactory = (
	ns: NS,
	name: string,
	purchased?: boolean
) => new LazyTarget(ns, name, purchased ?? false)

export * from './targets/target.js'
export * from './targets/deploy-target.js'
export * from './targets/target.js'
export * from './targets/lazy-target.js'
export * from './targets/server-target.js'
