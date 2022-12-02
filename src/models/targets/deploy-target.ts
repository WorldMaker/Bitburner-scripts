import { Target } from './target'

/**
 * Deploy Target has useful functions for deployment
 */
export class DeployTarget extends Target {
	checkRunning(
		script: FilenameOrPID,
		...args: (string | number | boolean)[]
	): boolean {
		return this.ns.isRunning(script, this.name, ...args)
	}

	copyFiles(files: string | string[], source?: string): boolean {
		return this.ns.scp(files, this.name, source)
	}

	clearProcesses(safetyGuard?: boolean): boolean {
		return this.ns.killall(this.name, safetyGuard)
	}

	clearProcess(
		script: string,
		...args: (string | number | boolean)[]
	): boolean {
		return this.ns.kill(script, this.name, ...args)
	}

	startProcess(
		script: string,
		threads = 1,
		...args: (string | number | boolean)[]
	): number {
		return this.ns.exec(script, this.name, threads, ...args)
	}
}
