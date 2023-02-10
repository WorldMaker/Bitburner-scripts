import { NsLogger } from '../logging/logger'
import { Config } from '../models/config'
import { RootedService, Service } from '../models/service'
import { PlayerStats } from '../models/stats'
import { DeploymentService } from './deployment'

export class ServiceService implements Service {
	private readonly services: Service[] = []
	private readonly rootedServices: RootedService[] = []
	private readonly factories: Array<
		() => Service | Promise<Service | null | undefined> | null | undefined
	> = []
	private readonly transient: Service[] = []
	private deploymentService?: DeploymentService
	private stats?: PlayerStats

	constructor(
		private readonly ns: NS,
		private readonly logger: NsLogger,
		private readonly config: Config
	) {}

	useDeploymentService(deploymentService: DeploymentService) {
		this.deploymentService = deploymentService
	}

	register(...services: Service[]) {
		this.services.push(...services)
	}

	registerFactory(
		factory: () =>
			| Service
			| Promise<Service | null | undefined>
			| null
			| undefined
	) {
		this.factories.push(factory)
	}

	registerRooted(service: RootedService) {
		this.rootedServices.push(service)
	}

	summarize(): string | void {
		const services = [...this.services]
		services.reverse()

		if (this.stats && this.deploymentService) {
			this.deploymentService.summarize(this.stats)
		}

		for (const service of [
			...this.rootedServices,
			...services,
			...this.transient,
		]) {
			const result = service.summarize()
			if (result) {
				this.logger.log(result)
			}
		}

		this.transient.splice(0, this.transient.length)
	}

	async manage(): Promise<void> {
		this.config.load()

		this.transient.splice(0, this.transient.length)

		for (const factory of this.factories) {
			const service = factory()
			if (service) {
				if ('then' in service) {
					const asyncService = await service
					if (asyncService) {
						this.transient.push(asyncService)
					}
				} else {
					this.transient.push(service)
				}
			}
		}

		for (const service of [...this.transient, ...this.services]) {
			const result = service.manage()
			if (result) {
				await result
			}
		}

		this.stats = new PlayerStats(this.ns)

		if (this.deploymentService) {
			const rooted = this.deploymentService.deploy(this.stats)
			for (const service of this.rootedServices) {
				await service.manage(rooted)
			}
		}

		this.config.save()
	}
}
