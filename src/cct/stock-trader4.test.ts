import { expect } from 'chai'
import { Logger } from 'tslog'
import { stockTrader4 } from './stock-trader4'

describe('Algorithmic Stock Trader IV', () => {
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

	it('solves an example', () => {
		const result = stockTrader4(
			[
				10,
				[
					198, 123, 30, 66, 22, 35, 57, 132, 156, 46, 9, 141, 92, 19, 60, 169,
					123, 120, 169, 194, 154, 1,
				],
			],
			logger
		)
		expect(result).to.equal(526)
	})
})
