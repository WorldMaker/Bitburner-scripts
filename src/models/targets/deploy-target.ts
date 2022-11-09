import { SimpleTarget } from './simple-target'

/**
 * Deploy Target has useful functions for deployment
 */
export class DeployTarget extends SimpleTarget {
	isRunning(script: FilenameOrPID, ...args: (string | number | boolean)[]) {
		return this.ns.isRunning(script, this.name, ...args)
	}

	scp(files: string | string[], source?: string) {
		return this.ns.scp(files, this.name, source)
	}

	killall(safetyGuard?: boolean) {
		return this.ns.killall(this.name, safetyGuard)
	}

	kill(script: string, ...args: (string | number | boolean)[]) {
		return this.ns.kill(script, this.name, ...args)
	}

	exec(script: string, threads = 1, ...args: (string | number | boolean)[]) {
		return this.ns.exec(script, this.name, threads, ...args)
	}
}
