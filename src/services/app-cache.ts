import { App } from '../models/app'

export const PayloadAll = 'payload-all.js'
export const PayloadG = 'payload-g.js'
export const PayloadH = 'payload-h.js'
export const PayloadW = 'payload-w.js'

export class AppCacheService {
	private apps = new Map<string, App>()
	constructor(private ns: NS) {
		this.apps.set(PayloadAll, new App(ns, PayloadAll))
		this.apps.set(PayloadG, new App(ns, PayloadG, true))
		this.apps.set(PayloadH, new App(ns, PayloadH, true, true))
		this.apps.set(PayloadW, new App(ns, PayloadW))
	}

	getApp(name: string) {
		if (this.apps.has(name)) {
			return this.apps.get(name)!
		}
		const app = new App(this.ns, name)
		this.apps.set(app.name, app)
		return app
	}
}
