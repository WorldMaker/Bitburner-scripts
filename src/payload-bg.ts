import { payload } from './payload-bbase'

export const main = (ns: NS) => payload(ns, (target) => ns.grow(target))
