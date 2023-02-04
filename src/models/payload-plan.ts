import { App } from './app'
import { BatchPlans } from './batch'
import { ServerTarget } from './targets/server-target'

export interface DeployPlan {
	target: ServerTarget
	app: App
	threads: number
	batch?: BatchPlans
	batchStart?: Date
}

export interface KillPlan {
	filename: string
	args: (string | number | boolean)[]
	pid: number
}

export interface ExistingPayloadPlan {
	type: 'existing'
	server: ServerTarget
}

export interface ChangePayloadPlan {
	type: 'change'
	server: ServerTarget
	killall: boolean
	kills?: KillPlan[]
	deployments: DeployPlan[]
}

export type PayloadPlan = ExistingPayloadPlan | ChangePayloadPlan

export interface PayloadPlanner {
	plan(
		rooted: Iterable<ServerTarget>,
		strategy?: string | null
	): Iterable<PayloadPlan>
	summarize(): string
}
