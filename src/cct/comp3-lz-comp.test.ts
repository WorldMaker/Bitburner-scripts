import { expect } from 'chai'
import { Logger } from 'tslog'
import { logArgs } from '../logging/tslog-util'
import { comp2lz } from './comp2-lz'
import { comp3lzComp } from './comp3-lz-comp'

describe('Compression III: LZ Compression', function () {
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

	const compressExample = (data: string, expected: string) => async () => {
		const result = await comp3lzComp(data, () => Promise.resolve(), logger)
		expect(result).to.equal(expected)
		const roundtrip = comp2lz(result, logger)
		expect(roundtrip).to.equal(data, 'expected to roundtrip')
	}

	it(
		'solves given example abracadabra',
		compressExample('abracadabra', '7abracad47')
	)
	it(
		'solves given example mississippi',
		compressExample('mississippi', '4miss433ppi')
	)
	it(
		'solves given example aAAaAAaAaAA',
		compressExample('aAAaAAaAaAA', '3aAA53038')
	)
	it(
		'solves given example 2718281828',
		compressExample('2718281828', '627182844')
	)
	it(
		'solves given example abcdefghijk',
		compressExample('abcdefghijk', '9abcdefghi02jk')
	)

	// skipped tests are too slow
	it.skip(
		'solves given example aaaaaaaaaaaa (12a)',
		compressExample('aaaaaaaaaaaa', '3aaa93')
	)
	it.skip(
		'solves given example aaaaaaaaaaaaa (13a)',
		compressExample('aaaaaaaaaaaaa', '4aaaa94')
	)
	it.skip(
		'solves given example aaaaaaaaaaaaaa (14a)',
		compressExample('aaaaaaaaaaaaaa', '1a71068')
	)

	it(
		'solves wild example xiv4Nv…',
		compressExample(
			'xiv4Nv4Nv4Nv4DBe7XBe7XBe7Xqtyt7lZlZlZlZloqZla6oyiAyupvwzSg4UWkwzSj0kwzSj0k1s0Q',
			'5xiv4N835DBe7X349XBe7Xqtyt162lZ627loqZla6163yiA139upvwzSg4U07WkwzSj0168wzSj0k1s141Q'
		)
	)
	it(
		'solves wild example FpiAfw…',
		compressExample(
			'FpiAfw6EdV1fG1fG1f1fj0b22zRpj4h7w4Kg7w4Kg7w4ALPv2N4ALPv2N4qm',
			'9FpiAfw6Ed04V1fG437f1fj0b2113zRp1874h7w4Kg856ALPv2N278LPv2N4qm'
		)
	)
})
