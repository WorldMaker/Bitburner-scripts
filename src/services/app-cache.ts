import { App } from '../models/app'

export class AppCacheService {
	private apps = new Map<string, App>()
	constructor(private ns: NS) {}

	getApp(name: string) {
		if (this.apps.has(name)) {
			return this.apps.get(name)!
		}
		const app = new App(this.ns, name)
		this.apps.set(app.name, app)
		return app
	}
}
