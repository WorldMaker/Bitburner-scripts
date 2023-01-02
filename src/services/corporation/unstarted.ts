import { Company, MyCompany, StartingCity } from '../../models/corporation'
import { NsLogger } from '../../logging/logger'
import { PhaseManager } from './phase'

const SmartSupply = 'Smart Supply'
const SellAll = 'MAX'
const SellAtMarketPrice = 'MP'

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
