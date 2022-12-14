import { expect } from 'chai'
import { Logger } from 'tslog'
import { minimumTrianglePathSum } from './min-triangle-path-sum'

describe('Minimum Path Sum in a Triangle', () => {
	const logs: any[] = []
	const logger = new Logger({ type: 'hidden' })
	logger.attachTransport((logObj) => logs.push(logObj))
	const prettyLogger = new Logger({ type: 'pretty' })

	afterEach(function () {
		if (this.currentTest?.state === 'failed') {
			for (const log of logs) {
				prettyLogger.log(log._meta.logLevelId, log._meta.logLevelName, log['0'])
			}
		}
		// clear logs
		logs.length = 0
	})

	it('solves the given example', () => {
		const result = minimumTrianglePathSum(
			[[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]],
			logger
		)
		expect(result).to.equal(11)
	})

	it('solves another example', () => {
		const result = minimumTrianglePathSum(
			[[5], [6, 5], [1, 1, 2], [7, 8, 3, 5], [4, 3, 2, 1, 6]],
			logger
		)
		expect(result).to.equal(15)
	})
})
