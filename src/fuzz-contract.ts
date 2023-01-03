import { evaluateCct } from './cct'
import { NsLogger } from './logging/logger'

const CooperativeThreadingTime = 1000 /* ms */

export async function main(ns: NS) {
	const quietLogger = new NsLogger(ns)
	const logger = new NsLogger(ns, true)

	let lastCooperative = Date.now()
	const cooperative = async (summarize: () => string) => {
		const now = Date.now()
		if (now - lastCooperative >= CooperativeThreadingTime) {
			logger.log(summarize())
			await ns.sleep(Math.random() * 1000 /* ms */)
			lastCooperative = now
		}
	}

	const [contractType, contractCount] = ns.args
	if (typeof contractType !== 'string' || typeof contractCount !== 'number') {
		logger.fatal`Please provide a contract type and count of dummy contracts to build; got [${contractType}, ${contractCount}]`
		return
	}

	for (let i = 0; i < contractCount; i++) {
		ns.codingcontract.createDummyContract(contractType)
	}

	const skiplist = new Set<string>()
	const contracts = ns.ls('home', '.cct')
	const elapsed: number[] = []
	let successes = 0

	for (const contract of contracts) {
		const type = ns.codingcontract.getContractType(contract)

		if (type !== contractType) {
			continue
		}

		const data = ns.codingcontract.getData(contract)

		const start = performance.now()

		const { known, solver } = evaluateCct(
			contractType,
			data,
			cooperative,
			quietLogger.getLogger(),
			skiplist,
			true
		)

		const result = await solver()

		const end = performance.now()

		if (!known) {
			logger.fatal`Unknown contract type ${contractType}`
			return
		}

		const time = end - start
		elapsed.push(time)

		const success = ns.codingcontract.attempt(result, contract, 'home')

		if (success) {
			logger.success`✔ in ${time} given ${data}: ${success}`
			successes++
		} else {
			logger.warn`❌ in ${time} given ${data}`
			if (result.length && result.length > 100) {
				logger.debug`\t${result.length} result items`
				quietLogger.debug`\t${result}`
			} else {
				logger.debug`\t${result}`
			}
		}

		// give the game pause time between long calculations
		await ns.sleep(20 /* ms */)
	}

	// final summary

	if (!elapsed.length) {
		return
	}

	if (successes === elapsed.length) {
		logger.success`${successes}/${elapsed.length} in ${elapsed.reduce(
			(acc, cur) => acc + cur / elapsed.length,
			0
		)} avg time`
	} else {
		logger.info`${successes}/${elapsed.length} in ${elapsed.reduce(
			(acc, cur) => acc + cur / elapsed.length,
			0
		)} avg time`
	}
}
