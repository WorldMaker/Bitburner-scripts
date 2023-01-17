import { App } from './app'
import { BatchPlans } from './batch'
import { Target } from './target'

export interface DeployPlan {
	target: Target
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
	server: Target
}

export interface ChangePayloadPlan {
	type: 'change'
	server: Target
	killall: boolean
	kills?: KillPlan[]
	deployments: DeployPlan[]
}

export type PayloadPlan = ExistingPayloadPlan | ChangePayloadPlan

export interface PayloadPlanner {
	plan(
		rooted: Iterable<Target>,
		strategy?: string | null
	): Iterable<PayloadPlan>
	summarize(): string
}
