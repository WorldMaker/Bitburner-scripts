import { Logger } from 'tslog'
import { interleaveArgs, TemplateLogger } from './template-logger'
import { logArgs } from './tslog-util'

export class NsLogger extends TemplateLogger {
	constructor(private ns: NS, private displayLogger = false) {
		super(new Logger({ type: 'hidden' }, { nsDisplay: displayLogger }))
		this.logger.attachTransport((logObj) => {
			this.log(logObj._meta.logLevelName, ' ', ...logArgs(logObj))
			if (logObj.nsDisplay && !this.displayLogger) {
				this.ns.tprint(logObj._meta.logLevelName, ' ', ...logArgs(logObj))
			}
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
		if (this.displayLogger) {
			this.ns.tprint(...args)
		}
	}

	success(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.log(69, 'SUCCESS', ...interleaveArgs(strings, ...values))
	}

	hooray(strings: TemplateStringsArray, ...values: unknown[]) {
		this.display('SUCCESS ', ...interleaveArgs(strings, ...values))
		return this.logger.log(69, 'SUCCESS', ...interleaveArgs(strings, ...values))
	}
}
