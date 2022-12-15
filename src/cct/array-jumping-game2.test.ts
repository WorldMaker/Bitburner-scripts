import { expect } from 'chai'
import { Logger } from 'tslog'
import { logArgs } from '../logging/tslog-util'
import { arrayJumpingGame2 } from './array-jumping-game2'

describe('Array Jumping Game II', () => {
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

	const solveExample = (data: number[], expected: number) => () => {
		const result = arrayJumpingGame2(data, logger)
		expect(result).to.equal(expected)
	}

	it('solves a simple impossible example', solveExample([1, 0, 1], 0))
	it('solves a simple example', solveExample([1, 1], 1))
	it(
		'solves a wild impossible example',
		solveExample([2, 3, 1, 1, 0, 3, 2, 2, 4, 1, 8, 1], 0)
	)
	it(
		'solves a wild possible example',
		solveExample([2, 7, 10, 3, 0, 4, 0, 5, 7, 3, 0, 4, 7, 5, 0, 10, 7], 3)
	)
	it(
		'solves another wild example (from game 1)',
		solveExample([5, 7, 9, 3, 0, 7], 1)
	)
})
