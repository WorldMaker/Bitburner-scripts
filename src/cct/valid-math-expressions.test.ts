import { expect } from 'chai'
import { Logger } from 'tslog'
import { logArgs } from '../logging/tslog-util'
import {
	MathExpressionInput,
	solveValidMathExpressions,
} from './valid-math-expressions'

describe('Find All Valid Math Expressions', function () {
	this.timeout(5 /* s */ * 1000 /* ms */)

	const logs: any[] = []
	const logger = new Logger({ type: 'hidden' })
	logger.attachTransport((logObj) => logs.push(logObj))
	const prettyLogger = new Logger({ type: 'pretty' })

	afterEach(function () {
		if (this.currentTest?.state === 'failed') {
			for (const log of logs) {
				prettyLogger.log(
					log._meta.logLevelId,
					log._meta.logLevelName,
					...logArgs(log)
				)
			}
		}
		// clear logs
		logs.length = 0
	})

	const solveExample =
		(data: MathExpressionInput, expected: string[]) => async () => {
			const result = await solveValidMathExpressions(
				data,
				() => Promise.resolve(),
				logger
			)
			expect(result).to.deep.equal(expected)
		}

	const solveExampleLength =
		(data: MathExpressionInput, expected: number) => async () => {
			const result = await solveValidMathExpressions(data, () =>
				Promise.resolve()
			)
			expect(result).to.have.length(expected)
		}

	it('solves given 123 example', solveExample(['123', 6], ['1*2*3', '1+2+3']))
	it('solves given 105 example', solveExample(['105', 5], ['1*0+5', '10-5']))

	it(
		'solves wild two-zero failure ["480205",-97]',
		solveExample(['480205', -97], [])
	)

	// slow test
	it.skip(
		'solves wild failure 98042474106',
		solveExampleLength(['98042474106', 21], 1808)
	)

	it(
		'solves wild example 6323557575',
		solveExample(
			['6323557575', -13],
			[
				'6*3*2+3*5+5-7-57-5',
				'6*3*2+3*5-5-7-57+5',
				'6*3*2+3*5-57+5-7-5',
				'6*3*2+3*5-57-5-7+5',
				'6*3*2+3+5*5-7+5-75',
				'6*3*2+3+5*5-75-7+5',
				'6*3*2+355-7*57-5',
				'6*3*23+5-57-5*75',
				'6*3+2*3+5+5-7*5-7-5',
				'6*3+2*3+5+5-7-5*7-5',
				'6*3+2*3+5+5-7-5-7*5',
				'6*3+2*3+5-5*7+5-7-5',
				'6*3+2*3+5-5*7-5-7+5',
				'6*3+2*3+5-5-7*5-7+5',
				'6*3+2*3+5-5-7+5-7*5',
				'6*3+2*3+5-5-7-5*7+5',
				'6*3+2*3-5+5-7*5-7+5',
				'6*3+2*3-5+5-7+5-7*5',
				'6*3+2*3-5+5-7-5*7+5',
				'6*3+2*3-5-5*7+5-7+5',
				'6*3+2+35+5+7-5-75',
				'6*3+2+35+5-75+7-5',
				'6*3+2+35-5+7+5-75',
				'6*3+2+35-5-75+7+5',
				'6*3+2-3*5+5+7+5-7*5',
				'6*3+2-3*5+5+7-5*7+5',
				'6*3+2-3*5+5-7*5+7+5',
				'6*3+2-3*5-5*7+5+7+5',
				'6*3+2-3+5*5+7-57-5',
				'6*3+2-3+5+5*7+5-75',
				'6*3+2-3+5+5+7*5-75',
				'6*3+2-3+5+5-75+7*5',
				'6*3-2*3*5-5+7-5+7-5',
				'6*3-2*3-5*5+7*5-7*5',
				'6*3-2*3-5*5+7+5-7-5',
				'6*3-2*3-5*5+7-5-7+5',
				'6*3-2*3-5*5+75-75',
				'6*3-2*3-5*5-7*5+7*5',
				'6*3-2*3-5*5-7+5+7-5',
				'6*3-2*3-5*5-7-5+7+5',
				'6*3-2*3-5*5-75+75',
				'6*3-2+3+55-7-5-75',
				'6*3-2+3+55-75-7-5',
				'6*3-2+3-5+5*7-57-5',
				'6*3-2+3-5-57+5*7-5',
				'6*3-2+3-5-57-5+7*5',
				'6*3-2+3-55+7*5-7-5',
				'6*3-2+3-55-7+5*7-5',
				'6*3-2+3-55-7-5+7*5',
				'6*3-2+35+5-7-57-5',
				'6*3-2+35-5-7-57+5',
				'6*3-2+35-57+5-7-5',
				'6*3-2+35-57-5-7+5',
				'6*3-23+5*5+7-5*7-5',
				'6*3-23+5*5+7-5-7*5',
				'6*3-23+5*5-7*5+7-5',
				'6*3-23+5+57+5-75',
				'6*3-23+55+7+5-75',
				'6*3-23+55-75+7+5',
				'6*3-23-55+7*5+7+5',
				'6*3-23-55+7+5*7+5',
				'6*3-23-55+7+5+7*5',
				'6*32-3*55+7*5-75',
				'6*32-3*55-75+7*5',
				'6*32-355+75+75',
				'6+3*2*3*5-57-57+5',
				'6+3*2*3+5+5-7*5-7-5',
				'6+3*2*3+5+5-7-5*7-5',
				'6+3*2*3+5+5-7-5-7*5',
				'6+3*2*3+5-5*7+5-7-5',
				'6+3*2*3+5-5*7-5-7+5',
				'6+3*2*3+5-5-7*5-7+5',
				'6+3*2*3+5-5-7+5-7*5',
				'6+3*2*3+5-5-7-5*7+5',
				'6+3*2*3-5+5-7*5-7+5',
				'6+3*2*3-5+5-7+5-7*5',
				'6+3*2*3-5+5-7-5*7+5',
				'6+3*2*3-5-5*7+5-7+5',
				'6+3*2+3*5+5+7-57+5',
				'6+3*2+3*5-57+5+7+5',
				'6+3*2+3-5+57-5-75',
				'6+3*2+35-5+7-57-5',
				'6+3*2+35-57-5+7-5',
				'6+3*2-3+5*5-7*5-7-5',
				'6+3*2-3+5*5-7-5*7-5',
				'6+3*2-3+5*5-7-5-7*5',
				'6+3*2-3+5+5*7-57-5',
				'6+3*2-3+5-57+5*7-5',
				'6+3*2-3+5-57-5+7*5',
				'6+3*2-3+55-7+5-75',
				'6+3*2-3+55-75-7+5',
				'6+3*2-3-5+5*7-57+5',
				'6+3*2-3-5-57+5*7+5',
				'6+3*2-3-5-57+5+7*5',
				'6+3*2-3-55+7*5-7+5',
				'6+3*2-3-55-7+5*7+5',
				'6+3*2-3-55-7+5+7*5',
				'6+3*2-35*5+75+75',
				'6+3*23-5*5+7+5-75',
				'6+3*23-5*5-75+7+5',
				'6+3*23-55+7-5*7-5',
				'6+3*23-55+7-5-7*5',
				'6+3*23-55-7*5+7-5',
				'6+3+2*3*5-5*7-5-7-5',
				'6+3+2*3*5-5-7*5-7-5',
				'6+3+2*3*5-5-7-5*7-5',
				'6+3+2*3*5-5-7-5-7*5',
				'6+3+2*3-5+57-5-75',
				'6+3+2*35-5-7-5-75',
				'6+3+2*35-5-75-7-5',
				'6+3+2+3+5+5-7*5-7+5',
				'6+3+2+3+5+5-7+5-7*5',
				'6+3+2+3+5+5-7-5*7+5',
				'6+3+2+3+5-5*7+5-7+5',
				'6+3+2-3*5+5-7+5-7-5',
				'6+3+2-3*5+5-7-5-7+5',
				'6+3+2-3*5-5-7+5-7+5',
				'6+3+2-3-5*5+7-5+7-5',
				'6+3+23*5-57-5-75',
				'6+3+23+5*5-7*5-7*5',
				'6+3+23+5+5+7-57-5',
				'6+3+23+5-5+7-57+5',
				'6+3+23+5-57+5+7-5',
				'6+3+23+5-57-5+7+5',
				'6+3+23-5+5+7-57+5',
				'6+3+23-5-57+5+7+5',
				'6+3+23-55+7+5-7+5',
				'6+3+23-55-7+5+7+5',
				'6+3-2+3*5+5*7+5-75',
				'6+3-2+3*5+5+7*5-75',
				'6+3-2+3*5+5-75+7*5',
				'6+3-2+3+5+5+7-5*7-5',
				'6+3-2+3+5+5+7-5-7*5',
				'6+3-2+3+5+5-7*5+7-5',
				'6+3-2+3+5-5*7+5+7-5',
				'6+3-2+3+5-5*7-5+7+5',
				'6+3-2+3+5-5+7+5-7*5',
				'6+3-2+3+5-5+7-5*7+5',
				'6+3-2+3+5-5-7*5+7+5',
				'6+3-2+3-5+5+7+5-7*5',
				'6+3-2+3-5+5+7-5*7+5',
				'6+3-2+3-5+5-7*5+7+5',
				'6+3-2+3-5-5*7+5+7+5',
				'6+3-2-3*5*5-7+57+5',
				'6+3-2-3*5+5*7-5*7-5',
				'6+3-2-3*5+5*7-5-7*5',
				'6+3-2-3*5+5+7-5-7-5',
				'6+3-2-3*5+5-7-5+7-5',
				'6+3-2-3*5+57-57-5',
				'6+3-2-3*5-5*7+5*7-5',
				'6+3-2-3*5-5*7-5+7*5',
				'6+3-2-3*5-5+7*5-7*5',
				'6+3-2-3*5-5+7+5-7-5',
				'6+3-2-3*5-5+7-5-7+5',
				'6+3-2-3*5-5+75-75',
				'6+3-2-3*5-5-7*5+7*5',
				'6+3-2-3*5-5-7+5+7-5',
				'6+3-2-3*5-5-7-5+7+5',
				'6+3-2-3*5-5-75+75',
				'6+3-2-3*5-57+57-5',
				'6+3-2-35+5+7+5-7+5',
				'6+3-2-35+5-7+5+7+5',
				'6+3-23+5*5-7-5-7-5',
				'6+32-3*5*5+7+5+7+5',
				'6+32-3+5*5+7-5-75',
				'6+32-3+5*5-75+7-5',
				'6+32-3-5*5+7+5-7*5',
				'6+32-3-5*5+7-5*7+5',
				'6+32-3-5*5-7*5+7+5',
				'6+3235-57*57-5',
				'6-3*2*3-5*5+7+5+7+5',
				'6-3*2+3*5+5+7-5*7-5',
				'6-3*2+3*5+5+7-5-7*5',
				'6-3*2+3*5+5-7*5+7-5',
				'6-3*2+3*5-5*7+5+7-5',
				'6-3*2+3*5-5*7-5+7+5',
				'6-3*2+3*5-5+7+5-7*5',
				'6-3*2+3*5-5+7-5*7+5',
				'6-3*2+3*5-5-7*5+7+5',
				'6-3*2+355+7-5*75',
				'6-3*2-3+5-5+7-5-7-5',
				'6-3*2-3+5-5-7-5+7-5',
				'6-3*2-3-5+5*7-5*7-5',
				'6-3*2-3-5+5*7-5-7*5',
				'6-3*2-3-5+5+7-5-7-5',
				'6-3*2-3-5+5-7-5+7-5',
				'6-3*2-3-5+57-57-5',
				'6-3*2-3-5-5*7+5*7-5',
				'6-3*2-3-5-5*7-5+7*5',
				'6-3*2-3-5-5+7*5-7*5',
				'6-3*2-3-5-5+7+5-7-5',
				'6-3*2-3-5-5+7-5-7+5',
				'6-3*2-3-5-5+75-75',
				'6-3*2-3-5-5-7*5+7*5',
				'6-3*2-3-5-5-7+5+7-5',
				'6-3*2-3-5-5-7-5+7+5',
				'6-3*2-3-5-5-75+75',
				'6-3*2-3-5-57+57-5',
				'6-3*2-3-55*7+5*75',
				'6-3*2-3-55-7+57-5',
				'6-3*23+5+5+75-7*5',
				'6-3*23+5+5-7*5+75',
				'6-3*23+5-5*7+5+75',
				'6-3+2*3+5*5-7*5-7-5',
				'6-3+2*3+5*5-7-5*7-5',
				'6-3+2*3+5*5-7-5-7*5',
				'6-3+2*3+5+5*7-57-5',
				'6-3+2*3+5-57+5*7-5',
				'6-3+2*3+5-57-5+7*5',
				'6-3+2*3+55-7+5-75',
				'6-3+2*3+55-75-7+5',
				'6-3+2*3-5+5*7-57+5',
				'6-3+2*3-5-57+5*7+5',
				'6-3+2*3-5-57+5+7*5',
				'6-3+2*3-55+7*5-7+5',
				'6-3+2*3-55-7+5*7+5',
				'6-3+2*3-55-7+5+7*5',
				'6-3+2+3-5*5+7-5+7-5',
				'6-3+2-3+5*5+7*5-75',
				'6-3+2-3+5*5-75+7*5',
				'6-3+2-3+55-7*5-7*5',
				'6-3+2-3-5*5+7+5-7+5',
				'6-3+2-3-5*5-7+5+7+5',
				'6-3+2-3-55+75-7*5',
				'6-3+2-3-55-7*5+75',
				'6-3+2-35+57-5*7-5',
				'6-3+2-35+57-5-7*5',
				'6-3+2-35-5*7+57-5',
				'6-3+23-5*5-7+5-7-5',
				'6-3+23-5*5-7-5-7+5',
				'6-3-2*3+5-5+7-5-7-5',
				'6-3-2*3+5-5-7-5+7-5',
				'6-3-2*3-5+5*7-5*7-5',
				'6-3-2*3-5+5*7-5-7*5',
				'6-3-2*3-5+5+7-5-7-5',
				'6-3-2*3-5+5-7-5+7-5',
				'6-3-2*3-5+57-57-5',
				'6-3-2*3-5-5*7+5*7-5',
				'6-3-2*3-5-5*7-5+7*5',
				'6-3-2*3-5-5+7*5-7*5',
				'6-3-2*3-5-5+7+5-7-5',
				'6-3-2*3-5-5+7-5-7+5',
				'6-3-2*3-5-5+75-75',
				'6-3-2*3-5-5-7*5+7*5',
				'6-3-2*3-5-5-7+5+7-5',
				'6-3-2*3-5-5-7-5+7+5',
				'6-3-2*3-5-5-75+75',
				'6-3-2*3-5-57+57-5',
				'6-3-2*3-55*7+5*75',
				'6-3-2*3-55-7+57-5',
				'6-3-2*35+57-5+7-5',
				'6-3-2*35-5+7+57-5',
				'6-3-2+3*5-5-7-5-7-5',
				'6-3-2-3*5+5-7+5-7+5',
				'6-3-2-3-5*5+7+5+7-5',
				'6-3-2-3-5*5+7-5+7+5',
				'6-32*3+5-5+7-5+75',
				'6-32*3+5-5+75+7-5',
				'6-32*3-5+5+7-5+75',
				'6-32*3-5+5+75+7-5',
				'6-32*3-5-5+7+5+75',
				'6-32*3-5-5+75+7+5',
				'6-32+3+5+5*7+5-7*5',
				'6-32+3+5+5*7-5*7+5',
				'6-32+3+5+5+7*5-7*5',
				'6-32+3+5+5+7+5-7-5',
				'6-32+3+5+5+7-5-7+5',
				'6-32+3+5+5+75-75',
				'6-32+3+5+5-7*5+7*5',
				'6-32+3+5+5-7+5+7-5',
				'6-32+3+5+5-7-5+7+5',
				'6-32+3+5+5-75+75',
				'6-32+3+5+57-57+5',
				'6-32+3+5-5*7+5*7+5',
				'6-32+3+5-5*7+5+7*5',
				'6-32+3+5-5+7+5-7+5',
				'6-32+3+5-5-7+5+7+5',
				'6-32+3+5-57+57+5',
				'6-32+3+55*7-5*75',
				'6-32+3+55+7-57+5',
				'6-32+3-5+5+7+5-7+5',
				'6-32+3-5+5-7+5+7+5',
				'6-32-3*5+5*7+5-7-5',
				'6-32-3*5+5*7-5-7+5',
				'6-32-3*5+5+7*5-7-5',
				'6-32-3*5+5-7+5*7-5',
				'6-32-3*5+5-7-5+7*5',
				'6-32-3*5-5+7*5-7+5',
				'6-32-3*5-5-7+5*7+5',
				'6-32-3*5-5-7+5+7*5',
				'6-32-355-7+5*75',
				'63*2+3-5-57-5-75',
				'63*2+3-55-7-5-75',
				'63*2+3-55-75-7-5',
				'63+2*3+5-5*7-57+5',
				'63+2*3+5-57+5-7*5',
				'63+2*3+5-57-5*7+5',
				'63+2-3*55+7+5+75',
				'63+2-3*55+75+7+5',
				'63-2*3+5-5*7-5*7-5',
				'63-2*3+5-5*7-5-7*5',
				'63-2*3+5-5-7*5-7*5',
				'63-2*3-5*5+7-57+5',
				'63-2*3-5+5-7*5-7*5',
				'63-2*3-5-5*7+5-7*5',
				'63-2*3-5-5*7-5*7+5',
				'63-2+3+5+5-7-5-75',
				'63-2+3+5+5-75-7-5',
				'63-2+3+5-5-7+5-75',
				'63-2+3+5-5-75-7+5',
				'63-2+3-5+5-7+5-75',
				'63-2+3-5+5-75-7+5',
				'63-2+35-57-57+5',
				'63-23+5+5+7+5-75',
				'63-23+5+5-75+7+5',
				'632-35-5*7-575',
				'632-35-575-7*5',
			]
		)
	)
	it(
		'solves wild example 68544196',
		solveExample(
			['68544196', -29],
			[
				'6*8-5*4*4*1+9-6',
				'6*8-5*4*4+1*9-6',
				'6*8-5*4-4+1-9*6',
				'6+8+5-4-41-9+6',
				'6+8+5-44-1-9+6',
				'6+8-5+4*4*1-9*6',
				'6+8-5+4*4-1*9*6',
				'6+8-5+4-4*1*9-6',
				'6+8-54-4*1+9+6',
				'6+8-54-4+1*9+6',
				'6+85*4-41*9-6',
				'6-8*5+4+4*1-9+6',
				'6-8*5+4+4-1*9+6',
				'6-8*5-4-4+19-6',
				'6-8+5-4*4-1-9-6',
				'6-8-5*4*4-1+9*6',
				'6-8-5*4-4*1-9+6',
				'6-8-5*4-4-1*9+6',
				'6-8-5+4-41+9+6',
				'6-8-5-4-4+1-9-6',
			]
		)
	)
	it(
		'solves wild example 4412771994',
		solveExample(
			['4412771994', -70],
			[
				'4*4*1*2+7-7+1-9-94',
				'4*4*1*2+7-7+1-99-4',
				'4*4*1*2-7+7+1-9-94',
				'4*4*1*2-7+7+1-99-4',
				'4*4*1+2+7+7+1-9-94',
				'4*4*1+2+7+7+1-99-4',
				'4*4*1-2+7-7+1+9-94',
				'4*4*1-2+7-7+1-9*9-4',
				'4*4*1-2-7+7+1+9-94',
				'4*4*1-2-7+7+1-9*9-4',
				'4*4*1-27*7*1+9+94',
				'4*4*1-27*7*1+99+4',
				'4*4*1-27*7+1*9+94',
				'4*4*1-27*7+1*99+4',
				'4*4+1*2+7+7+1-9-94',
				'4*4+1*2+7+7+1-99-4',
				'4*4+1+2*7-7+1-99+4',
				'4*4+1+2+7+7*1-9-94',
				'4*4+1+2+7+7*1-99-4',
				'4*4+1+2+7+7-1*9-94',
				'4*4+1+2+7+7-1*99-4',
				'4*4+1+2-7-7+19-94',
				'4*4+1-2+7-7*1+9-94',
				'4*4+1-2+7-7*1-9*9-4',
				'4*4+1-2+7-7+1*9-94',
				'4*4+1-2+7-7-1*9*9-4',
				'4*4+1-2-7+7*1+9-94',
				'4*4+1-2-7+7*1-9*9-4',
				'4*4+1-2-7+7+1*9-94',
				'4*4+1-2-7+7-1*9*9-4',
				'4*4+1-27*7-1+9+94',
				'4*4+1-27*7-1+99+4',
				'4*4+12+77-19*9-4',
				'4*4+12-7-7+1+9-94',
				'4*4+12-7-7+1-9*9-4',
				'4*4+12-77+1-9-9-4',
				'4*4-1*2+7-7+1+9-94',
				'4*4-1*2+7-7+1-9*9-4',
				'4*4-1*2-7+7+1+9-94',
				'4*4-1*2-7+7+1-9*9-4',
				'4*4-1*27*7*1+9+94',
				'4*4-1*27*7*1+99+4',
				'4*4-1*27*7+1*9+94',
				'4*4-1*27*7+1*99+4',
				'4*4-1+2*7-7*1*9-9*4',
				'4*4-1-2*7*7-1+9+9-4',
				'4*4-1-2*7+7-1-9*9+4',
				'4*4-1-2-7-7*1*9-9-4',
				'4*4-1-2-77-19+9+4',
				'4*4-1-27*7+1+9+94',
				'4*4-1-27*7+1+99+4',
				'4*4-1-27-7*1*9+9-4',
				'4*4-12*7-7+1+9-9+4',
				'4*4-12*7-7+1-9+9+4',
				'4*4-12-7-71+9-9+4',
				'4*4-12-7-71-9+9+4',
				'4*4-12-77-1+9-9+4',
				'4*4-12-77-1-9+9+4',
				'4*41-27*7*1-9-9*4',
				'4*41-27*7-1*9-9*4',
				'4+4*1*2+7+7-1-99+4',
				'4+4*1*2-7-71+9-9-4',
				'4+4*1*2-7-71-9+9-4',
				'4+4*1*2-77-1+9-9-4',
				'4+4*1*2-77-1-9+9-4',
				'4+4*1*27-7-19*9-4',
				'4+4*1+2*7-7*1+9-94',
				'4+4*1+2*7-7*1-9*9-4',
				'4+4*1+2*7-7+1*9-94',
				'4+4*1+2*7-7-1*9*9-4',
				'4+4*1+2+7+7+1-99+4',
				'4+4*1+2-77+1+9-9-4',
				'4+4*1+2-77+1-9+9-4',
				'4+4*1-2*77-1+9*9-4',
				'4+4*1-2+7-7+1-9*9+4',
				'4+4*1-2-7*7*1+9-9*4',
				'4+4*1-2-7*7+1*9-9*4',
				'4+4*1-2-7+7+1-9*9+4',
				'4+4*1-27-7+1-9-9*4',
				'4+4*12-77*1-9-9*4',
				'4+4*12-77-1*9-9*4',
				'4+4+1*2*7-7*1+9-94',
				'4+4+1*2*7-7*1-9*9-4',
				'4+4+1*2*7-7+1*9-94',
				'4+4+1*2*7-7-1*9*9-4',
				'4+4+1*2+7+7+1-99+4',
				'4+4+1*2-77+1+9-9-4',
				'4+4+1*2-77+1-9+9-4',
				'4+4+1+2*7-7-1+9-94',
				'4+4+1+2*7-7-1-9*9-4',
				'4+4+1+2*7-71-9-9-4',
				'4+4+1+2+7+7*1-99+4',
				'4+4+1+2+7+7-1*99+4',
				'4+4+1+2-7*7-19-9-4',
				'4+4+1+2-77*1+9-9-4',
				'4+4+1+2-77*1-9+9-4',
				'4+4+1+2-77+1*9-9-4',
				'4+4+1+2-77-1*9+9-4',
				'4+4+1+27+7-19-94',
				'4+4+1-2*77-19+94',
				'4+4+1-2+7-7*1-9*9+4',
				'4+4+1-2+7-7-1*9*9+4',
				'4+4+1-2-7*7-1+9-9*4',
				'4+4+1-2-7+7*1-9*9+4',
				'4+4+1-2-7+7-1*9*9+4',
				'4+4+1-27-7*1-9-9*4',
				'4+4+1-27-7-1*9-9*4',
				'4+4+12+7+7-1-9-94',
				'4+4+12+7+7-1-99-4',
				'4+4+12+7-7*19+9*4',
				'4+4+12+77-19*9+4',
				'4+4+12-7-7+1-9*9+4',
				'4+4+12-77+1-9-9+4',
				'4+4-1*2*77-1+9*9-4',
				'4+4-1*2+7-7+1-9*9+4',
				'4+4-1*2-7*7*1+9-9*4',
				'4+4-1*2-7*7+1*9-9*4',
				'4+4-1*2-7+7+1-9*9+4',
				'4+4-1*27-7+1-9-9*4',
				'4+4-1+2*7*7-19*9-4',
				'4+4-1+2*7-7+1+9-94',
				'4+4-1+2*7-7+1-9*9-4',
				'4+4-1-2*7*7-1+9+9+4',
				'4+4-1-2*77*1+9*9-4',
				'4+4-1-2*77+1*9*9-4',
				'4+4-1-2+7-7+19-94',
				'4+4-1-2+771-9*94',
				'4+4-1-2-7*7+1+9-9*4',
				'4+4-1-2-7+7+19-94',
				'4+4-1-2-7-7*1*9-9+4',
				'4+4-1-27-7*1*9+9+4',
				'4+4-12*7-7-1+9+9-4',
				'4+4-12*7-71+9*9-4',
				'4+4-12*77*1+9*94',
				'4+4-12*77+1*9*94',
				'4+4-12-7*7+19-9*4',
				'4+4-127+71-9-9-4',
				'4+41+2-7-7*1-9-94',
				'4+41+2-7-7*1-99-4',
				'4+41+2-7-7-1*9-94',
				'4+41+2-7-7-1*99-4',
				'4+41-2*7*7+19-9*4',
				'4+41-2*7-7+1-99+4',
				'4+41-2+7-7*19+9+4',
				'4+41-2+7-7-19-94',
				'4+41-2-7+7-19-94',
				'4+41-27+7*1-99+4',
				'4+41-27+7-1*99+4',
				'4-4*1*2-7*7+19-9*4',
				'4-4*1*27+7*1-9+9*4',
				'4-4*1*27+7-1*9+9*4',
				'4-4*1+2*7-7*1-9*9+4',
				'4-4*1+2*7-7-1*9*9+4',
				'4-4*1+2+7+7-1+9-94',
				'4-4*1+2+7+7-1-9*9-4',
				'4-4*1+2-7*7-1-9-9-4',
				'4-4*1+2-77+1+9-9+4',
				'4-4*1+2-77+1-9+9+4',
				'4-4*1+27+7-1-9-94',
				'4-4*1+27+7-1-99-4',
				'4-4*1+27-7*19+9*4',
				'4-4*1-2*7*7+1-9+9*4',
				'4-4*1-2*77-1+9*9+4',
				'4-4*1-2*77-1-9+94',
				'4-4*1-2+7-71+9-9-4',
				'4-4*1-2+7-71-9+9-4',
				'4-4*12+7*7+19-94',
				'4-4*12+7-7+1+9-9*4',
				'4-4*12+77*1-9-94',
				'4-4*12+77*1-99-4',
				'4-4*12+77-1*9-94',
				'4-4*12+77-1*99-4',
				'4-4*12-7*7+1+9+9+4',
				'4-4*12-7+7+1+9-9*4',
				'4-4+1*2*7-7*1-9*9+4',
				'4-4+1*2*7-7-1*9*9+4',
				'4-4+1*2+7+7-1+9-94',
				'4-4+1*2+7+7-1-9*9-4',
				'4-4+1*2-7*7-1-9-9-4',
				'4-4+1*2-77+1+9-9+4',
				'4-4+1*2-77+1-9+9+4',
				'4-4+1*27+7-1-9-94',
				'4-4+1*27+7-1-99-4',
				'4-4+1*27-7*19+9*4',
				'4-4+1+2*7-7-1-9*9+4',
				'4-4+1+2*7-71-9-9+4',
				'4-4+1+2-7*7-19-9+4',
				'4-4+1+2-77*1+9-9+4',
				'4-4+1+2-77*1-9+9+4',
				'4-4+1+2-77+1*9-9+4',
				'4-4+1+2-77-1*9+9+4',
				'4-4+1+27-71+9-9*4',
				'4-4+1-2*7*7*1-9+9*4',
				'4-4+1-2*7*7-1*9+9*4',
				'4-4+1-2*7-71+9+9-4',
				'4-4+1-2+7-7*1*9-9-4',
				'4-4+1-2-7-7-19-9*4',
				'4-4+1-27-71-9+9*4',
				'4-4+12*77*1-994',
				'4-4+12*77-1*994',
				'4-4+12+7+7-1-99+4',
				'4-4+12-7-71+9-9-4',
				'4-4+12-7-71-9+9-4',
				'4-4+12-77-1+9-9-4',
				'4-4+12-77-1-9+9-4',
				'4-4-1*2*7*7+1-9+9*4',
				'4-4-1*2*77-1+9*9+4',
				'4-4-1*2*77-1-9+94',
				'4-4-1*2+7-71+9-9-4',
				'4-4-1*2+7-71-9+9-4',
				'4-4-1+2*7*7-19*9+4',
				'4-4-1+2*7-7+1-9*9+4',
				'4-4-1+2+7+7*1+9-94',
				'4-4-1+2+7+7*1-9*9-4',
				'4-4-1+2+7+7+1*9-94',
				'4-4-1+2+7+7-1*9*9-4',
				'4-4-1+2-7*7*1-9-9-4',
				'4-4-1+2-7*7-1*9-9-4',
				'4-4-1+2-77+19-9-4',
				'4-4-1+27+7*1-9-94',
				'4-4-1+27+7*1-99-4',
				'4-4-1+27+7-1*9-94',
				'4-4-1+27+7-1*99-4',
				'4-4-1-2*77*1+9*9+4',
				'4-4-1-2*77*1-9+94',
				'4-4-1-2*77+1*9*9+4',
				'4-4-1-2*77-1*9+94',
				'4-4-12*7-7-1+9+9+4',
				'4-4-12*7-71+9*9+4',
				'4-4-12*7-71-9+94',
				'4-4-12-7-7+1-9-9*4',
				'4-4-127+71-9-9+4',
				'4-41*2+7+7-19+9+4',
				'4-41*2-7-7*1+9+9+4',
				'4-41*2-7-7+1*9+9+4',
				'4-41*2-77*1+9*9+4',
				'4-41*2-77*1-9+94',
				'4-41*2-77+1*9*9+4',
				'4-41*2-77-1*9+94',
				'4-41+2+7*7+1+9-94',
				'4-41+2+7*7+1-9*9-4',
				'4-41+2-7*7*1+9+9-4',
				'4-41+2-7*7+1*9+9-4',
				'4-41+2-7*7+19-9+4',
				'4-41+2-7-7+1-9-9-4',
				'4-41-2*7+7+1+9-9*4',
				'4-41-2+7+7*1-9-9*4',
				'4-41-2+7+7-1*9-9*4',
				'4-41-2-7+71-99+4',
				'4-41-2-7-7+19-9*4',
				'4-41-2-77+1+9+9*4',
				'4-41-27+7+1-9-9+4',
				'4-41-27+71-9*9+4',
				'4-412+7+7*1+9*9*4',
				'4-412+7+7+1*9*9*4',
				'44*1+2*7-7*19+9-4',
				'44*1+2-7-7+1-9-94',
				'44*1+2-7-7+1-99-4',
				'44*1-27*7-19+94',
				'44*1-27+7+1-99+4',
				'44+1*2*7-7*19+9-4',
				'44+1*2-7-7+1-9-94',
				'44+1*2-7-7+1-99-4',
				'44+1+2-7-7*1-9-94',
				'44+1+2-7-7*1-99-4',
				'44+1+2-7-7-1*9-94',
				'44+1+2-7-7-1*99-4',
				'44+1-2*7*7+19-9*4',
				'44+1-2*7-7+1-99+4',
				'44+1-2+7-7*19+9+4',
				'44+1-2+7-7-19-94',
				'44+1-2-7+7-19-94',
				'44+1-27+7*1-99+4',
				'44+1-27+7-1*99+4',
				'44+12+7*7-19*9-4',
				'44+12+77-199-4',
				'44+12-7*7*1-9*9+4',
				'44+12-7*7-1*9*9+4',
				'44-1*27*7-19+94',
				'44-1*27+7+1-99+4',
				'44-1-2*7*7-1-9-9+4',
				'44-1-2*7-7*1*9-9*4',
				'44-1-27*7-1+9*9-4',
				'44-12*7-7-1-9-9-4',
				'44-12+7-7+1-9-94',
				'44-12+7-7+1-99-4',
				'44-12-7+7+1-9-94',
				'44-12-7+7+1-99-4',
				'44-127+7+19-9-4',
			]
		)
	)
	it.skip(
		'solves slow wild example 73282764099 without eval error',
		solveExampleLength(['73282764099', 83], 1114)
	)
	it.skip(
		'solves slow wild example 264810649091',
		solveExampleLength(['264810649091', 9], 8603)
	)
})
