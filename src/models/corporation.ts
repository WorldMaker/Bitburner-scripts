export const MyCompanyName = '0corp'
export const MyAgricultureDivisionName = '0ag'
export const MyTobaccoDivisionName = '0bac'

export const Jobs = [
	'Operations',
	'Engineer',
	'Business',
	'Management',
	'Research & Development',
]
export const BoostMaterials = ['Hardware', 'Robots', 'AI Cores', 'Real Estate']
export const LevelUpgrades = [
	'Smart Factories',
	'Smart Storage',
	'FocusWires',
	'Neural Accelerators',
	'Speech Processor Implants',
	'Nuoptimal Nootropic Injector Implants',
	'Wilson Analytics',
]
export const Cities = [
	'Aevum',
	'Congqing',
	'New Tokyo',
	'Sector-12',
	'Ishima',
	'Volhaven',
]
export const StartingCity = 'Sector-12'
export const TobaccoDevelopmentCity = 'Aevum'

export type CompanyState =
	| 'Unknown'
	| 'Unstarted'
	| 'Agriculture0Round'
	| 'Agriculture1Round'
	| 'Agriculture2Round'
	| 'Tobacco2Round'
	| 'Tobacco3Round'
	| 'Tobacco4Round'
	| 'Public'

export class Company {
	private state: CompanyState = 'Unknown'

	constructor(private ns: NS) {
		const corp = ns.corporation.getCorporation()
		if (corp.public) {
			this.state = 'Public'
		} else if (corp.divisions.length === 2) {
			const nextOffer = ns.corporation.getInvestmentOffer()
			switch (nextOffer.round) {
				case 4:
					this.state = 'Tobacco3Round'
					break
				case 3:
					this.state = 'Tobacco2Round'
					break
				default:
					this.state = 'Tobacco4Round'
			}
		} else if (corp.divisions.length === 1) {
			const nextOffer = ns.corporation.getInvestmentOffer()
			switch (nextOffer.round) {
				case 3:
					this.state = 'Agriculture2Round'
					break
				case 2:
					this.state = 'Agriculture1Round'
					break
				case 1:
					this.state = 'Agriculture0Round'
			}
		} else if (corp.divisions.length === 0) {
			this.state = 'Unstarted'
		} else {
			this.state = 'Unknown'
		}
	}

	getState() {
		return this.state
	}
}
