import { App } from './app'
import { Target } from './target'

export interface DeployPlan {
	target: Target
	app: App
	threads: number
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
	plan(rooted: Iterable<Target>): Iterable<PayloadPlan>
	summarize(): string
}
