import { Logger } from './logger'

export const GrowthSecurityRaisePerThread = 0.004
export const HackSecurityRaisePerThread = 0.002
export const WeakenSecurityLowerPerThread = 0.05
export const DesiredHackingSkim = 0.25

function calcGrowth(
	formulas: HackingFormulas,
	server: Server,
	player: Player,
	threads: number,
	cores?: number
): number {
	const growthPercent = formulas.growPercent(server, threads, player, cores)
	return (server.moneyAvailable + threads) * growthPercent
}

function binarySearchGrowThreads(
	formulas: HackingFormulas,
	minThreads: number,
	maxThreads: number,
	server: Server,
	player: Player,
	logger?: Logger,
	cores?: number
): number {
	if (logger) {
		logger.log(`searching growth between ${minThreads} and ${maxThreads}`)
	}
	if (minThreads >= maxThreads) {
		return maxThreads
	}

	const midThreads = Math.ceil(minThreads + (maxThreads - minThreads) / 2)
	const newMoney = calcGrowth(formulas, server, player, midThreads, cores)
	if (newMoney > server.moneyMax) {
		if (
			calcGrowth(formulas, server, player, midThreads - 1, cores) <
			server.moneyMax
		) {
			return midThreads
		}
		return binarySearchGrowThreads(
			formulas,
			minThreads,
			midThreads - 1,
			server,
			player,
			logger,
			cores
		)
	} else if (newMoney < server.moneyMax) {
		return binarySearchGrowThreads(
			formulas,
			midThreads + 1,
			maxThreads,
			server,
			player,
			logger,
			cores
		)
	} else {
		return midThreads
	}
}

export function calculateGrowThreads(
	formulas: HackingFormulas,
	server: Server,
	player: Player,
	logger?: Logger,
	cores?: number
): number {
	if (server.moneyAvailable >= server.moneyMax) {
		return 0
	}
	const minThreads = 1

	// Calculate a raw theoretical maximum threads
	const growFactor = 1 / (1 - (server.moneyMax - 1) / server.moneyMax)
	const maxThreads = Math.ceil(
		Math.log(growFactor) /
			Math.log(formulas.growPercent(server, 1, player, cores))
	)

	const threads = binarySearchGrowThreads(
		formulas,
		minThreads,
		maxThreads,
		server,
		player,
		logger,
		cores
	)

	return threads
}
