import { App } from './app'
import { Server } from './server'

export interface DeployPlan {
	target: Server
	app: App
	threads: number
}

export interface KillPlan {
	target: Server
	app: App
	args: any[]
}

export interface ExistingPayloadPlan {
	type: 'existing'
	server: Server
}

export interface ChangePayloadPlan {
	type: 'change'
	server: Server
	killall: boolean
	kills?: KillPlan[]
	deployments: DeployPlan[]
}

export type PayloadPlan = ExistingPayloadPlan | ChangePayloadPlan

export interface PayloadPlanner {
	plan(rooted: Iterable<Server>): Iterable<PayloadPlan>
}
