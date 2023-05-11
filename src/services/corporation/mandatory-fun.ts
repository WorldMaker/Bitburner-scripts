import { Company } from '../../models/corporation'

const PartyBudget = 500_000 /* $/employee */ // roughly 5% increase in hap/mor
const AutoCoffeeResearch = 'AutoBrew'
const AutoPartyResearch = 'AutoPartyManager'

export class MandatoryFunService {
	#coffees = 0
	#parties = 0
	#offices = 0

	constructor(private readonly company: Company) {}

	summarize() {
		const { ns, logger } = this.company.context
		if (this.#offices) {
			logger.info`encouraging mandatory fun across ${
				this.#offices
			} offices; ☕ ${ns.formatNumber(this.#coffees)}, 🎉 ${ns.formatNumber(
				this.#parties
			)}`
		}
	}

	manage() {
		const { ns, logger } = this.company.context
		this.#offices = 0

		for (const divisionName of this.company.corporation?.divisions ?? []) {
			const hasAutoCoffee = ns.corporation.hasResearched(
				divisionName,
				AutoCoffeeResearch
			)
			const hasAutoParty = ns.corporation.hasResearched(
				divisionName,
				AutoPartyResearch
			)

			if (hasAutoCoffee && hasAutoParty) {
				continue
			}

			for (const city of Object.values(ns.enums.CityName)) {
				this.#offices++
				const office = ns.corporation.getOffice(divisionName, city)
				if (!hasAutoParty && (office.avgMor < 95 || office.avgHap < 95)) {
					logger.debug`throwing party for ${divisionName} ${city}`
					try {
						ns.corporation.throwParty(divisionName, city, PartyBudget)
						this.#parties++
					} catch (err) {
						logger.warn`unable to throw party: ${err}`
					}
				}
				if (!hasAutoCoffee && office.avgEne < 95) {
					logger.debug`buying coffee for ${divisionName} ${city}`
					try {
						ns.corporation.buyCoffee(divisionName, city)
						this.#coffees++
					} catch (err) {
						logger.warn`unable to buy coffee: ${err}`
					}
				}
			}
		}
	}
}
