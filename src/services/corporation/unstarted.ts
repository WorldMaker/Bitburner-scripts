import { Company, MyCompany, StartingCity } from '../../models/corporation'
import { PhaseManager } from './phase'

const CorporationBudget = 150_000_000_000
const SmartSupply = 'Smart Supply'
const SellAll = 'MAX'
const SellAtMarketPrice = 'MP'

export class UnstartedPhaseManager implements PhaseManager {
	private waitingForCash = true

	constructor(private readonly company: Company) {}

	summarize() {
		const { logger } = this.company.context
		if (!this.waitingForCash) {
			logger.info`starting a company`
		}
	}

	manage(): Promise<void> {
		const { ns, logger } = this.company.context
		let created = false
		try {
			created ||= ns.corporation.createCorporation(MyCompany.Name, false)
		} catch (err) {
			logger.warn`Can't self-fund: ${err}`
		}

		if (ns.getServerMoneyAvailable('home') < CorporationBudget) {
			this.waitingForCash = true
			if (this.company.context.hacknetHashStrategy.startsWith('corp')) {
				this.company.context.hacknetHashStrategy = 'money'
			}
			return Promise.resolve()
		}
		this.waitingForCash = false

		created ||= ns.corporation.createCorporation(MyCompany.Name, true)
		if (!created) {
			logger.error`unable to start company`
			return Promise.resolve()
		}

		if (this.company.context.hacknetHashStrategy === 'money') {
			this.company.context.hacknetHashStrategy = 'corpfunds'
		}

		ns.corporation.expandIndustry(
			MyCompany.MaterialDivision.Type,
			MyCompany.MaterialDivision.Name
		)
		ns.corporation.purchaseUnlock(SmartSupply)
		for (const city of Object.values(ns.enums.CityName)) {
			if (city !== StartingCity) {
				ns.corporation.expandCity(MyCompany.MaterialDivision.Name, city)
				ns.corporation.purchaseWarehouse(MyCompany.MaterialDivision.Name, city)
			}
			ns.corporation.setSmartSupply(MyCompany.MaterialDivision.Name, city, true)
			for (const material of MyCompany.MaterialDivision.SellMaterials) {
				ns.corporation.sellMaterial(
					MyCompany.MaterialDivision.Name,
					city,
					material,
					SellAll,
					SellAtMarketPrice
				)
			}
			while (
				ns.corporation.hireEmployee(MyCompany.MaterialDivision.Name, city)
			) {
				// wait for all hired
			}
			// first three jobs should be Operations, Engineer, Business
			ns.corporation.setAutoJobAssignment(
				MyCompany.MaterialDivision.Name,
				city,
				'Operations',
				1
			)
			ns.corporation.setAutoJobAssignment(
				MyCompany.MaterialDivision.Name,
				city,
				'Engineer',
				1
			)
			ns.corporation.setAutoJobAssignment(
				MyCompany.MaterialDivision.Name,
				city,
				'Business',
				1
			)
		}
		ns.corporation.hireAdVert(MyCompany.MaterialDivision.Name)
		return Promise.resolve()
	}
}
