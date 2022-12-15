import { Logger } from 'tslog'

export function* interleaveArgs(
	strings: TemplateStringsArray,
	...values: unknown[]
) {
	for (let i = 0; i < strings.length; i++) {
		yield strings[i]
		if (i < values.length) {
			yield values[i]
		}
	}
}

export class TemplateLogger {
	constructor(protected logger: Logger<any>) {}

	debug(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.debug(...interleaveArgs(strings, ...values))
	}

	error(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.error(...interleaveArgs(strings, ...values))
	}

	fatal(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.fatal(...interleaveArgs(strings, ...values))
	}

	info(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.info(...interleaveArgs(strings, ...values))
	}

	silly(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.silly(...interleaveArgs(strings, ...values))
	}

	trace(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.trace(...interleaveArgs(strings, ...values))
	}

	warn(strings: TemplateStringsArray, ...values: unknown[]) {
		return this.logger.warn(...interleaveArgs(strings, ...values))
	}
}
