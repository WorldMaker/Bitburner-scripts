export class Logger {
	constructor(private ns: NS) {}

	display(...args: any[]) {
		this.ns.tprint(...args)
		this.log(...args)
	}

	log(...args: any[]) {
		this.ns.print(...args)
	}
}
