import { NsLogger } from '../../logging/logger'
import { Company } from '../../models/corporation'

const PartyBudget = 500_000 /* $/employee */ // roughly 5% increase in hap/mor
const AutoCoffeeResearch = 'AutoBrew'
const AutoPartyResearch = 'AutoPartyManager'

export class MandatoryFunService {
	constructor(
		private ns: NS,
		private logger: NsLogger,
		private company: Company
	) {}

	summarize() {
		return `INFO encouraging mandatory fun across company`
	}

	manage() {
		for (const divisionName of this.company.corporation?.divisions ?? []) {
			const hasAutoCoffee = this.ns.corporation.hasResearched(
				divisionName,
				AutoCoffeeResearch
			)
			const hasAutoParty = this.ns.corporation.hasResearched(
				divisionName,
				AutoPartyResearch
			)

			if (hasAutoCoffee && hasAutoParty) {
				continue
			}

			for (const city of Object.values(this.ns.enums.CityName)) {
				const office = this.ns.corporation.getOffice(divisionName, city)
				if (!hasAutoParty && (office.avgMor < 95 || office.avgHap < 95)) {
					this.logger.debug`throwing party for ${divisionName} ${city}`
					try {
						this.ns.corporation.throwParty(divisionName, city, PartyBudget)
					} catch (err) {
						this.logger.warn`unable to throw party: ${err}`
					}
				}
				if (!hasAutoCoffee && office.avgEne < 95) {
					this.logger.debug`buying coffee for ${divisionName} ${city}`
					try {
						this.ns.corporation.buyCoffee(divisionName, city)
					} catch (err) {
						this.logger.warn`unable to buy coffee: ${err}`
					}
				}
			}
		}
	}
}
