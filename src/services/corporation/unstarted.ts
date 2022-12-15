import {
	Cities,
	Company,
	Jobs,
	MyCompany,
	StartingCity,
} from '../../models/corporation'
import { NsLogger } from '../../logging/logger'
import { PhaseManager } from './phase'

const SmartSupply = 'Smart Supply'
const SellAll = 'MAX'
const SellAtMarketPrice = 'MP'
const StartingEmployees = 3

export class UnstartedPhaseManager implements PhaseManager {
	constructor(
		private ns: NS,
		private logger: NsLogger,
		private company: Company
	) {}

	summarize(): string {
		return `INFO starting a company`
	}

	manage(): Promise<void> {
		const created =
			this.ns.corporation.createCorporation(MyCompany.Name, false) ||
			this.ns.corporation.createCorporation(MyCompany.Name, true)
		if (!created) {
			this.logger.error`unable to start company`
			return Promise.resolve()
		}
		this.ns.corporation.expandIndustry(
			MyCompany.MaterialDivision.Type,
			MyCompany.MaterialDivision.Name
		)
		this.ns.corporation.unlockUpgrade(SmartSupply)
		for (const city of Cities) {
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
			for (let i = 0; i < StartingEmployees; i++) {
				const newEmployee = this.ns.corporation.hireEmployee(
					MyCompany.MaterialDivision.Name,
					city
				)
				// first three jobs should be Operations, Engineer, Business
				if (newEmployee) {
					this.ns.corporation.assignJob(
						MyCompany.MaterialDivision.Name,
						city,
						newEmployee.name,
						Jobs[i]
					)
				}
			}
		}
		this.ns.corporation.hireAdVert(MyCompany.MaterialDivision.Name)
		return Promise.resolve()
	}
}
