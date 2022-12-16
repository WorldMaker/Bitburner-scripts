import { Logger } from 'tslog'
import { arrayJumpingGame1 } from './array-jumping-game1'
import { arrayJumpingGame2 } from './array-jumping-game2'
import { comp1rle } from './comp1-rle'
import { comp2lz } from './comp2-lz'
import { enc1caeser } from './enc1-caesar'
import { enc2 } from './enc2'
import { solveGenerateIps } from './generate-ip-addresses'
import { colorBipartiteGraph } from './graph-2color'
import { largestPrimeFactor } from './largest-prime-factor'
import { mergeOverlappingIntervals } from './merge-overlapping-intervals'
import { minimumTrianglePathSum } from './min-triangle-path-sum'
import { shortestGridPath } from './shortest-path-grid'
import { spiralizeMatrix } from './spiralize-matrix'
import { stockTrader1 } from './stock-trader1'
import { stockTrader2 } from './stock-trader2'
import { stocktrader3 } from './stock-trader3'
import { stockTrader4 } from './stock-trader4'
import { subarrayMaximumSum } from './subarray-max-sum'
import { sumPartitions } from './total-ways-to-sum1'
import { sumCombinations } from './total-ways-to-sum2'
import { uniquePathsGrid1 } from './unique-paths-grid1'
import { uniquePathsGrid2 } from './unique-paths-grid2'
import { solveValidMathExpressions } from './valid-math-expressions'

export interface CctEvaluation {
	known: boolean
	attempt: boolean
	result: any
}

export function evaluateCct(
	type: string,
	data: any,
	logger?: Logger<any>,
	allResults = false
): CctEvaluation {
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
				result: stockTrader4(data, logger),
			}
		case 'Array Jumping Game':
			return {
				known: true,
				attempt: true,
				result: arrayJumpingGame1(data),
			}
		case 'Array Jumping Game II':
			return {
				known: true,
				attempt: true,
				result: arrayJumpingGame2(data, logger),
			}
		case 'Compression I: RLE Compression':
			return {
				known: true,
				attempt: true,
				result: comp1rle(data),
			}
		case 'Compression II: LZ Decompression':
			return {
				known: true,
				attempt: true,
				result: comp2lz(data, logger),
			}
		case 'Encryption I: Caesar Cipher':
			return {
				known: true,
				attempt: true,
				result: enc1caeser(data),
			}
		case 'Encryption II: Vigenère Cipher':
			return {
				known: true,
				attempt: true,
				result: enc2(data),
			}
		case 'Find All Valid Math Expressions':
			const quickVmeAttempt = data.length <= 10
			return {
				known: true,
				attempt: quickVmeAttempt,
				result:
					quickVmeAttempt || allResults
						? solveValidMathExpressions(data)
						: undefined,
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
		case 'Merge Overlapping Intervals':
			return {
				known: true,
				attempt: true,
				result: mergeOverlappingIntervals(data),
			}
		case 'Minimum Path Sum in a Triangle':
			return {
				known: true,
				attempt: true,
				result: minimumTrianglePathSum(data, logger),
			}
		case 'Proper 2-Coloring of a Graph':
			return {
				known: true,
				attempt: true,
				result: colorBipartiteGraph(data),
			}
		case 'Shortest Path in a Grid':
			return {
				known: true,
				attempt: true,
				result: shortestGridPath(data),
			}
		case 'Spiralize Matrix':
			return {
				known: true,
				attempt: true,
				result: spiralizeMatrix(data),
			}
		case 'Subarray with Maximum Sum':
			return {
				known: true,
				attempt: true,
				result: subarrayMaximumSum(data, logger),
			}
		case 'Total Ways to Sum':
			const quickSumAttempt = data < 50
			return {
				known: true,
				attempt: quickSumAttempt,
				result: quickSumAttempt || allResults ? sumPartitions(data) : undefined,
			}
		case 'Total Ways to Sum II':
			return {
				known: true,
				attempt: true,
				result: sumCombinations(data),
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
				result: uniquePathsGrid2(data, logger),
			}
	}
	return {
		known: false,
		attempt: false,
		result: undefined,
	}
}
