import { Target, TargetFactory } from '.'

export const simpleTargetFactory: TargetFactory<SimpleTarget> = (
	ns: NS,
	name: string,
	purchased?: boolean
) => new SimpleTarget(ns, name, purchased)

export class SimpleTarget extends Target {
	private worth: number | null = null
	private minSecurityLevel: number | null = null

	getWorth(): number {
		if (this.worth === null) {
			this.worth = this.ns.getServerMaxMoney(this.name)
		}
		return this.worth
	}

	getMinSecurityLevel() {
		if (this.minSecurityLevel === null) {
			this.minSecurityLevel = this.ns.getServerMinSecurityLevel(this.name)
		}
		return this.minSecurityLevel
	}

	checkSecurityLevel() {
		return this.ns.getServerSecurityLevel(this.name)
	}

	checkMoneyAvailable() {
		return this.ns.getServerMoneyAvailable(this.name)
	}
}
