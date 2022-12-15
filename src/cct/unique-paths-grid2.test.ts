import { expect } from 'chai'
import { Logger } from 'tslog'
import { logArgs } from '../logging/tslog-util'
import { uniquePathsGrid2 } from './unique-paths-grid2'

describe('Unique Paths in a Grid II', () => {
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

	it('solves an example', () => {
		const result = uniquePathsGrid2(
			[
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 1, 0, 0, 0, 0],
				[1, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 1, 1, 0, 1],
				[0, 0, 0, 0, 0, 0, 0, 1],
				[0, 0, 0, 0, 0, 0, 1, 0],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 1, 0, 0, 1],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 1, 0, 0, 0, 0, 1, 0],
			],
			logger
		)
		expect(result).to.equal(1258)
	})
})
