import { enc1caeser } from './enc1-caesar'
import { solveGenerateIps } from './generate-ip-addresses'
import { largestPrimeFactor } from './largest-prime-factor'
import { stockTrader1 } from './stock-trader1'
import { stockTrader2 } from './stock-trader2'
import { stocktrader3 } from './stock-trader3'
import { stockTrader4 } from './stock-trader4'
import { uniquePathsGrid1 } from './unique-paths-grid1'
import { uniquePathsGrid2 } from './unique-paths-grid2'
import { solveValidMathExpressions } from './valid-math-expressions'

export interface CctEvaluation {
	known: boolean
	attempt: boolean
	result: any
}

export function evaluateCct(type: string, data: any): CctEvaluation {
	switch (type) {
		case 'Algorithmic Stock Trader I':
			return {
				known: true,
				attempt: true,
				result: stockTrader1(data),
			}
		case 'Algorithmic Stock Trader II':
			return {
				known: true,
				attempt: true,
				result: stockTrader2(data),
			}
		case 'Algorithmic Stock Trader III':
			return {
				known: true,
				attempt: true,
				result: stocktrader3(data),
			}
		case 'Algorithmic Stock Trader IV':
			return {
				known: true,
				attempt: true,
				result: stockTrader4(data),
			}
		case 'Encryption I: Caesar Cipher':
			return {
				known: true,
				attempt: true,
				result: enc1caeser(data),
			}
		case 'Find All Valid Math Expressions':
			return {
				known: true,
				attempt: true,
				result: solveValidMathExpressions(data),
			}
		case 'Find Largest Prime Factor':
			return {
				known: true,
				attempt: true,
				result: largestPrimeFactor(data),
			}
		case 'Generate IP Addresses':
			return {
				known: true,
				attempt: true,
				result: solveGenerateIps(data),
			}
		case 'Total Ways to Sum':
		case 'Total Ways to Sum II':
			return {
				known: true,
				attempt: false,
				result: undefined,
			}
		case 'Unique Paths in a Grid I':
			return {
				known: true,
				attempt: true,
				result: uniquePathsGrid1(data),
			}
		case 'Unique Paths in a Grid II':
			return {
				known: true,
				attempt: true,
				result: uniquePathsGrid2(data),
			}
	}
	return {
		known: false,
		attempt: false,
		result: undefined,
	}
}
