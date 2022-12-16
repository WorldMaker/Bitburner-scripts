import { expect } from 'chai'
import { Logger } from 'tslog'
import { logArgs } from '../logging/tslog-util'
import { subarrayMaximumSum } from './subarray-max-sum'

describe('Subarray with Maximum Sum', () => {
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
		const result = subarrayMaximumSum(data, logger)
		expect(result).to.equal(expected)
	}

	it(
		'solves a wild example',
		solveExample(
			[
				-7, 10, 6, 5, -5, -8, -5, -5, 1, -6, -4, -6, -4, -3, 5, 10, -3, 5, 2, 5,
				1, 0, 4, 5, 5, 7, 9,
			],
			55
		)
	)
})
