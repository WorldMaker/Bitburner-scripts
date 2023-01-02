import { expect } from 'chai'
import { Logger } from 'tslog'
import { logArgs } from '../logging/tslog-util'
import { sanitizeParentheses } from './sanitize-parentheses'

describe('Sanitize Parentheses in Expression', () => {
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

	const solveExample = (input: string, expected: string[]) => () => {
		const result = sanitizeParentheses(input, logger)
		expect(result).to.deep.equal(expected)
	}

	it('solves an empty input', solveExample('', ['']))
	it('solves an input with no parentheses', solveExample('a', ['a']))
	it('solves a simple balanced input', solveExample('()', ['()']))
	it(
		'solves given example ()())()',
		solveExample('()())()', ['(())()', '()()()'])
	)
	it(
		'solves given example (a)())()',
		solveExample('(a)())()', ['(a())()', '(a)()()'])
	)
	it('solves given example )(', solveExample(')(', ['']))
	it(
		'solves wild example ((a)(((a(a))a)',
		solveExample('((a)(((a(a))a)', [
			'((a)((aa))a)',
			'((a)(a(a))a)',
			'(a)(((aa))a)',
			'(a)((a(a))a)',
		])
	)
})
