import { Logger } from 'tslog'
import { arrayJumpingGame1 } from './array-jumping-game1'
import { arrayJumpingGame2 } from './array-jumping-game2'
import { comp1rle } from './comp1-rle'
import { comp2lz } from './comp2-lz'
import { comp3lzComp } from './comp3-lz-comp'
import { enc1caeser } from './enc1-caesar'
import { enc2 } from './enc2'
import { solveGenerateIps } from './generate-ip-addresses'
import { colorBipartiteGraph } from './graph-2color'
import { decodeHamming } from './hamming-decode'
import { encodeHamming } from './hamming-encode'
import { largestPrimeFactor } from './largest-prime-factor'
import { mergeOverlappingIntervals } from './merge-overlapping-intervals'
import { minimumTrianglePathSum } from './min-triangle-path-sum'
import { sanitizeParentheses } from './sanitize-parentheses'
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
	solver: () => Promise<any>
}

export type Cooperative = (summarize: () => string) => Promise<unknown>

export function evaluateCct(
	type: string,
	data: any,
	cooperative: Cooperative = () => Promise.resolve(),
	logger?: Logger<any>,
	skiplist = new Set<string>(),
	allResults = false
): CctEvaluation {
	const attempt = allResults || !skiplist.has(type)
	switch (type) {
		case 'Algorithmic Stock Trader I':
			return {
				known: true,
				attempt,
				solver: async () => stockTrader1(data),
			}
		case 'Algorithmic Stock Trader II':
			return {
				known: true,
				attempt,
				solver: async () => stockTrader2(data),
			}
		case 'Algorithmic Stock Trader III':
			return {
				known: true,
				attempt,
				solver: async () => stocktrader3(data),
			}
		case 'Algorithmic Stock Trader IV':
			return {
				known: true,
				attempt,
				solver: async () => stockTrader4(data, logger),
			}
		case 'Array Jumping Game':
			return {
				known: true,
				attempt,
				solver: async () => arrayJumpingGame1(data),
			}
		case 'Array Jumping Game II':
			return {
				known: true,
				attempt,
				solver: async () => arrayJumpingGame2(data, logger),
			}
		case 'Compression I: RLE Compression':
			return {
				known: true,
				attempt,
				solver: async () => comp1rle(data),
			}
		case 'Compression II: LZ Decompression':
			return {
				known: true,
				attempt,
				solver: async () => comp2lz(data, logger),
			}
		case 'Compression III: LZ Compression':
			return {
				known: true,
				attempt: allResults,
				solver: () => comp3lzComp(data, cooperative, logger),
			}
		case 'Encryption I: Caesar Cipher':
			return {
				known: true,
				attempt,
				solver: async () => enc1caeser(data),
			}
		case 'Encryption II: Vigenère Cipher':
			return {
				known: true,
				attempt,
				solver: async () => enc2(data),
			}
		case 'Find All Valid Math Expressions':
			return {
				known: true,
				attempt,
				solver: () => solveValidMathExpressions(data, cooperative, logger),
			}
		case 'Find Largest Prime Factor':
			return {
				known: true,
				attempt,
				solver: async () => largestPrimeFactor(data),
			}
		case 'Generate IP Addresses':
			return {
				known: true,
				attempt,
				solver: async () => solveGenerateIps(data),
			}
		case 'HammingCodes: Encoded Binary to Integer':
			return {
				known: true,
				attempt,
				solver: async () => decodeHamming(data),
			}
		case 'HammingCodes: Integer to Encoded Binary':
			return {
				known: true,
				attempt,
				solver: async () => encodeHamming(data),
			}
		case 'Merge Overlapping Intervals':
			return {
				known: true,
				attempt,
				solver: async () => mergeOverlappingIntervals(data),
			}
		case 'Minimum Path Sum in a Triangle':
			return {
				known: true,
				attempt,
				solver: async () => minimumTrianglePathSum(data, logger),
			}
		case 'Proper 2-Coloring of a Graph':
			return {
				known: true,
				attempt,
				solver: async () => colorBipartiteGraph(data),
			}
		case 'Sanitize Parentheses in Expression':
			return {
				known: true,
				attempt: allResults,
				solver: async () => sanitizeParentheses(data, logger),
			}
		case 'Shortest Path in a Grid':
			return {
				known: true,
				attempt,
				solver: async () => shortestGridPath(data),
			}
		case 'Spiralize Matrix':
			return {
				known: true,
				attempt,
				solver: async () => spiralizeMatrix(data),
			}
		case 'Subarray with Maximum Sum':
			return {
				known: true,
				attempt,
				solver: async () => subarrayMaximumSum(data, logger),
			}
		case 'Total Ways to Sum':
			return {
				known: true,
				attempt: data < 80 && attempt,
				solver: () => sumPartitions(data, cooperative),
			}
		case 'Total Ways to Sum II':
			return {
				known: true,
				attempt,
				solver: () => sumCombinations(data, cooperative),
			}
		case 'Unique Paths in a Grid I':
			return {
				known: true,
				attempt,
				solver: async () => uniquePathsGrid1(data),
			}
		case 'Unique Paths in a Grid II':
			return {
				known: true,
				attempt,
				solver: async () => uniquePathsGrid2(data, logger),
			}
	}
	return {
		known: false,
		attempt: false,
		solver: async () => undefined,
	}
}
