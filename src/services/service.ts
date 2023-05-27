import { NsContext } from '../models/context'
import { RootedService, Service } from '../models/service'
import { DeploymentService } from './deployment'

export class ServiceService implements Service {
	private readonly services: Service[] = []
	private readonly rootedServices: RootedService[] = []
	private readonly factories: Array<
		() => Service | Promise<Service | null | undefined> | null | undefined
	> = []
	private readonly transient: Service[] = []
	private deploymentService?: DeploymentService

	constructor(private readonly context: NsContext) {}

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
		const { logger } = this.context
		const services = [...this.services]
		services.reverse()

		const count =
			services.length +
			this.rootedServices.length +
			this.factories.length +
			(this.deploymentService ? 1 : 0)
		if (count) {
			logger.info`managing ${count} total services`
		}

		for (const service of [
			...(this.deploymentService ? [this.deploymentService] : []),
			...this.rootedServices,
			...services,
			...this.transient,
		]) {
			const result = service.summarize()
			if (result) {
				logger.log(result)
			}
		}

		this.transient.splice(0, this.transient.length)
	}

	async manage(): Promise<void> {
		this.context.load()

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

		if (this.deploymentService) {
			const rooted = this.deploymentService.deploy()
			for (const service of this.rootedServices) {
				await service.manage(rooted)
			}
		}

		this.context.save()
	}
}
