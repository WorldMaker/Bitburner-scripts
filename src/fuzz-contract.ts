import { evaluateCct } from './cct'
import { NsLogger } from './logging/logger'

export async function main(ns: NS) {
	const quietLogger = new NsLogger(ns)
	const cooperative = async () => await ns.sleep(20 /* ms */)
	const logger = new NsLogger(ns, true)

	const [contractType, contractCount] = ns.args
	if (typeof contractType !== 'string' || typeof contractCount !== 'number') {
		logger.fatal`Please provide a contract type and count of dummy contracts to build; got [${contractType}, ${contractCount}]`
		return
	}

	for (let i = 0; i < contractCount; i++) {
		ns.codingcontract.createDummyContract(contractType)
	}

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

		const { known, result } = await evaluateCct(
			contractType,
			data,
			cooperative,
			quietLogger.getLogger(),
			true
		)

		const end = performance.now()

		if (!known) {
			logger.fatal`Unknown contract type ${contractType}`
			return
		}

		const time = start - end
		elapsed.push(time)

		const success = ns.codingcontract.attempt(result, contract, 'home', {
			returnReward: true,
		})

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
