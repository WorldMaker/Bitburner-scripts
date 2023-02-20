import { Company, MyCompany, StartingCity } from '../../models/corporation'
import { NsLogger } from '../../logging/logger'
import { PhaseManager } from './phase'
import { Config } from '../../models/config'

const CorporationBudget = 150_000_000_000
const SmartSupply = 'Smart Supply'
const SellAll = 'MAX'
const SellAtMarketPrice = 'MP'

export class UnstartedPhaseManager implements PhaseManager {
	private waitingForCash = true

	constructor(
		private ns: NS,
		private config: Config,
		private logger: NsLogger,
		private company: Company
	) {}

	summarize() {
		if (!this.waitingForCash) {
			this.logger.info`starting a company`
		}
	}

	manage(): Promise<void> {
		let created = false
		try {
			created ||= this.ns.corporation.createCorporation(MyCompany.Name, false)
		} catch (err) {
			this.logger.warn`Can't self-fund: ${err}`
		}

		if (this.ns.getServerMoneyAvailable('home') < CorporationBudget) {
			this.waitingForCash = true
			if (this.config.hacknetHashStrategy.startsWith('corp')) {
				this.config.hacknetHashStrategy = 'money'
			}
			return Promise.resolve()
		}
		this.waitingForCash = false

		created ||= this.ns.corporation.createCorporation(MyCompany.Name, true)
		if (!created) {
			this.logger.error`unable to start company`
			return Promise.resolve()
		}

		if (this.config.hacknetHashStrategy === 'money') {
			this.config.hacknetHashStrategy = 'corpfunds'
		}

		this.ns.corporation.expandIndustry(
			MyCompany.MaterialDivision.Type,
			MyCompany.MaterialDivision.Name
		)
		this.ns.corporation.unlockUpgrade(SmartSupply)
		for (const city of Object.values(this.ns.enums.CityName)) {
			if (city !== StartingCity) {
				this.ns.corporation.expandCity(MyCompany.MaterialDivision.Name, city)
				this.ns.corporation.purchaseWarehouse(
					MyCompany.MaterialDivision.Name,
					city
				)
			}
			this.ns.corporation.setSmartSupply(
				MyCompany.MaterialDivision.Name,
				city,
				true
			)
			for (const material of MyCompany.MaterialDivision.SellMaterials) {
				this.ns.corporation.sellMaterial(
					MyCompany.MaterialDivision.Name,
					city,
					material,
					SellAll,
					SellAtMarketPrice
				)
			}
			while (
				this.ns.corporation.hireEmployee(MyCompany.MaterialDivision.Name, city)
			) {
				// wait for all hired
			}
			// first three jobs should be Operations, Engineer, Business
			this.ns.corporation.setAutoJobAssignment(
				MyCompany.MaterialDivision.Name,
				city,
				'Operations',
				1
			)
			this.ns.corporation.setAutoJobAssignment(
				MyCompany.MaterialDivision.Name,
				city,
				'Engineer',
				1
			)
			this.ns.corporation.setAutoJobAssignment(
				MyCompany.MaterialDivision.Name,
				city,
				'Business',
				1
			)
		}
		this.ns.corporation.hireAdVert(MyCompany.MaterialDivision.Name)
		return Promise.resolve()
	}
}
