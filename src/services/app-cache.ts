import {
	App,
	BatchPayloadG,
	BatchPayloadH,
	BatchPayloadW,
	PayloadAll,
	PayloadG,
	PayloadH,
	PayloadW,
	SalvoPayloadG,
	SalvoPayloadH,
	SalvoPayloadW,
} from '../models/app'

export class AppCacheService {
	private apps = new Map<string, App>()
	constructor(private ns: NS) {
		this.apps.set(BatchPayloadG, new App(ns, BatchPayloadG, false, false, true))
		this.apps.set(BatchPayloadH, new App(ns, BatchPayloadH, false, false, true))
		this.apps.set(BatchPayloadW, new App(ns, BatchPayloadW, false, false, true))
		this.apps.set(PayloadAll, new App(ns, PayloadAll))
		this.apps.set(PayloadG, new App(ns, PayloadG, true))
		this.apps.set(PayloadH, new App(ns, PayloadH, true, true))
		this.apps.set(PayloadW, new App(ns, PayloadW))
		this.apps.set(SalvoPayloadG, new App(ns, SalvoPayloadG))
		this.apps.set(SalvoPayloadH, new App(ns, SalvoPayloadH))
		this.apps.set(SalvoPayloadW, new App(ns, SalvoPayloadW))
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
