import { match } from 'minimatch'
import { NsLogger } from './logging/logger'

export async function main(ns: NS) {
	const [pattern] = ns.args

	const logger = new NsLogger(ns, true)

	const files = ns.ls('home')

	const matches = match(files, pattern.toString())

	for (const file of matches) {
		logger.trace`removing ${file}`
		ns.rm(file, 'home')
	}
}
