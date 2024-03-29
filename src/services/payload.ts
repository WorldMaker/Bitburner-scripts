import { getBatchArgs } from '../models/batch.js'
import { PayloadPlan } from '../models/payload-plan.js'

export class PayloadService {
	deliverAll(plans: Iterable<PayloadPlan>) {
		let delivered = 0
		for (const plan of plans) {
			if (this.deliver(plan)) {
				delivered++
			}
		}
		return delivered
	}

	deliver(plan: PayloadPlan) {
		if (plan.type === 'existing') {
			return true
		}

		if (plan.server.name !== 'home') {
			if (plan.killall) {
				plan.server.clearProcesses()
			} else if (plan.kills) {
				for (const kill of plan.kills) {
					plan.server.clearProcess(kill.filename, ...kill.args)
				}
			}
		}

		let deployed = true
		for (const deploy of plan.deployments) {
			plan.server.copyFiles(deploy.app.name)
			const started = plan.server.startProcess(
				deploy.app.name,
				deploy.threads,
				...deploy.app.getArgs(deploy.target),
				...(deploy.app.batch
					? getBatchArgs(deploy.batch!, deploy.batchStart!)
					: [])
			)
			if (!started) {
				deployed = false
			}
		}
		return deployed
	}
}
