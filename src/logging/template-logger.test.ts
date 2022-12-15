import { expect } from 'chai'
import { Logger } from 'tslog'
import { TemplateLogger } from './template-logger'

describe('Template Logger', () => {
	const logs: any[] = []
	const baseLogger = new Logger({ type: 'hidden' })
	baseLogger.attachTransport((logObj) => logs.push(logObj))

	afterEach(function () {
		// clear logs
		logs.length = 0
	})

	it('can log a debug template', () => {
		const a = 45
		const b = true
		const logger = new TemplateLogger(baseLogger)
		logger.debug`Test that a = ${a} and b = ${b}`
		expect(logs.length).to.equal(1)
		expect(logs[0]._meta.logLevelName).to.equal('DEBUG')
		expect(logs[0][0]).to.equal('Test that a = ')
		expect(logs[0][1]).to.equal(a)
		expect(logs[0][2]).to.equal(' and b = ')
		expect(logs[0][3]).to.equal(b)
	})

	it('can log an error template', () => {
		const a = 33
		const b = new Error('Example')
		const logger = new TemplateLogger(baseLogger)
		logger.error`There was an error on the way to Club ${a} and it was ${b}`
		expect(logs.length).to.equal(1)
		expect(logs[0]._meta.logLevelName).to.equal('ERROR')
		expect(logs[0][0]).to.equal('There was an error on the way to Club ')
		expect(logs[0][1]).to.equal(a)
		expect(logs[0][2]).to.equal(' and it was ')
		expect(logs[0][3].nativeError).to.equal(b)
	})

	it('can log an fatal template', () => {
		const a = 13
		const b = new Error('OH NO!')
		const logger = new TemplateLogger(baseLogger)
		logger.error`${a} grim things happened and then ${b}`
		expect(logs.length).to.equal(1)
		expect(logs[0]._meta.logLevelName).to.equal('ERROR')
		expect(logs[0][0]).to.equal('')
		expect(logs[0][1]).to.equal(a)
		expect(logs[0][2]).to.equal(' grim things happened and then ')
		expect(logs[0][3].nativeError).to.equal(b)
	})

	it('can log an info template', () => {
		const a = 97
		const b = ['hello']
		const logger = new TemplateLogger(baseLogger)
		logger.info`But did you know that a = ${a} and b = ${b}?`
		expect(logs.length).to.equal(1)
		expect(logs[0]._meta.logLevelName).to.equal('INFO')
		expect(logs[0][0]).to.equal('But did you know that a = ')
		expect(logs[0][1]).to.equal(a)
		expect(logs[0][2]).to.equal(' and b = ')
		expect(logs[0][3]).to.deep.equal(b)
		expect(logs[0][4]).to.equal('?')
	})

	it('can log a silly template', () => {
		const a = 420
		const b = { hello: 'world' }
		const logger = new TemplateLogger(baseLogger)
		logger.silly`Hanging out ${a} and ${b}`
		expect(logs.length).to.equal(1)
		expect(logs[0]._meta.logLevelName).to.equal('SILLY')
		expect(logs[0][0]).to.equal('Hanging out ')
		expect(logs[0][1]).to.equal(a)
		expect(logs[0][2]).to.equal(' and ')
		expect(logs[0][3]).to.deep.equal(b)
	})

	it('can log a trace template', () => {
		const a = false
		const b = { good: 'morrow' }
		const logger = new TemplateLogger(baseLogger)
		logger.trace`${b}: ${a}`
		expect(logs.length).to.equal(1)
		expect(logs[0]._meta.logLevelName).to.equal('TRACE')
		expect(logs[0][0]).to.equal('')
		expect(logs[0][1]).to.deep.equal(b)
		expect(logs[0][2]).to.equal(': ')
		expect(logs[0][3]).to.equal(a)
	})

	it('can log a warn template', () => {
		const a = ['nope']
		const b = new Error('Something to watch for')
		const logger = new TemplateLogger(baseLogger)
		logger.warn`Seeing ${a} and ${b}`
		expect(logs.length).to.equal(1)
		expect(logs[0]._meta.logLevelName).to.equal('WARN')
		expect(logs[0][0]).to.equal('Seeing ')
		expect(logs[0][1]).to.deep.equal(a)
		expect(logs[0][2]).to.equal(' and ')
		expect(logs[0][3].nativeError).to.equal(b)
	})
})
