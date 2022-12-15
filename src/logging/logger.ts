import { Logger } from 'tslog'
import { interleaveArgs, TemplateLogger } from './template-logger'
import { logArgs } from './tslog-util'

export class NsLogger extends TemplateLogger {
	constructor(private ns: NS) {
		super(new Logger({ type: 'hidden' }))
		this.logger.attachTransport((logObj) => {
			this.log(logObj._meta.logLevelName, ' ', ...logArgs(logObj))
		})
	}

	getLogger() {
		return this.logger
	}

	display(...args: any[]) {
		this.ns.tprint(...args)
		this.log(...args)
	}

	log(...args: any[]) {
		this.ns.print(...args)
	}

	success(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.log(69, 'SUCCESS', ...interleaveArgs(strings, ...values))
	}

	hooray(strings: TemplateStringsArray, ...values: unknown[]) {
		this.display('SUCCESS', ...interleaveArgs(strings, ...values))
		return this.logger.log(69, 'SUCCESS', ...interleaveArgs(strings, ...values))
	}
}
