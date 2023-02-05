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
		this.ns.print(...args)
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
		if (!this.displayLogger) {
			this.ns.tprint('SUCCESS ', ...interleaveArgs(strings, ...values))
		}
		return this.logger.log(69, 'SUCCESS', ...interleaveArgs(strings, ...values))
	}

	useful(strings: TemplateStringsArray, ...values: unknown[]) {
		if (!this.displayLogger) {
			this.ns.tprint('INFO ', ...interleaveArgs(strings, ...values))
		}
		return this.info(strings, ...values)
	}

	bigwarn(strings: TemplateStringsArray, ...values: unknown[]) {
		if (!this.displayLogger) {
			this.ns.tprint('WARN ', ...interleaveArgs(strings, ...values))
		}
		return this.warn(strings, ...values)
	}

	ohno(strings: TemplateStringsArray, ...values: unknown[]) {
		if (!this.displayLogger) {
			this.ns.tprint('ERROR ', ...interleaveArgs(strings, ...values))
		}
		return this.error(strings, ...values)
	}
}
