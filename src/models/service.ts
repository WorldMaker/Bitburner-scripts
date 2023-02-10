import { ServerTarget } from './targets/server-target'

export interface Service {
	summarize(): string | void
	manage(): Promise<unknown> | void
}

export interface RootedService {
	summarize(): void
	manage(rooted: Iterable<ServerTarget>): Promise<unknown>
}
