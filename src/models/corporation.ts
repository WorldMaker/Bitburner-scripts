export const MyCompany = Object.freeze({
	Name: '0corp',
	MaterialDivision: Object.freeze({
		Name: '0ag',
		Type: 'Agriculture',
		SellMaterials: Object.freeze(['Plants', 'Food']),
	}),
	ProductDivision: Object.freeze({
		Name: '0bac',
		Type: 'Tobacco',
		ProductBaseName: 'wacky',
		DesignInvestment: 1_000_000_000,
		MarketingInvestment: 1_000_000_000,
		TotalProducts: 3, // Bitburner restriction
	}),
})

export const Jobs = [
	'Operations',
	'Engineer',
	'Business',
	'Management',
	'Research & Development',
]
export const BoostMaterials = Object.freeze({
	Hardware: 'Hardware',
	Robots: 'Robots',
	AiCores: 'AI Cores',
	RealEstate: 'Real Estate',
})
export type BoostMaterial = typeof BoostMaterials[keyof typeof BoostMaterials]
export const LevelUpgrades = Object.freeze({
	SmartFactories: 'Smart Factories',
	SmartStorage: 'Smart Storage',
	FocusWires: 'FocusWires',
	NeuralAccelerators: 'Neural Accelerators',
	SpeechProcessorImplants: 'Speech Processor Implants',
	Nuoptimal: 'Nuoptimal Nootropic Injector Implants',
	WilsonAnalytics: 'Wilson Analytics',
	DreamSense: 'DreamSense',
	SalesBots: 'ABC SalesBots',
	ProjectInsight: 'Project Insight',
})
export type LevelUpgrade = typeof LevelUpgrades[keyof typeof LevelUpgrades]
export const Cities = [
	'Aevum',
	'Chongqing',
	'New Tokyo',
	'Sector-12',
	'Ishima',
	'Volhaven',
]
export const StartingCity = 'Sector-12'
export const ProductDevelopment = Object.freeze({
	City: 'Aevum',
	OfficeSizeUpgrade: 15,
	ResearchOfficeSizeOffset: 60,
	KeyResearch: 'Market-TA.II',
})

/**
 * Company State
 *
 * Multi-phase material then product bootstrap based on:
 * - Tinkered BN3 Guide: https://docs.google.com/document/d/1eqQ_KTnk3VkW1XLHjM2fAQbCNY05CTCE85mJFjeFDE8/edit#
 * - Mughur startCorp.js: https://pastebin.com/H1TzCbLm
 *
 * 1. Build up a Material Division through first 2 investment rounds
 * 2. Build up a Product Division through remaining 2 investment rounds
 * 3. Go public
 */
export type CompanyState =
	| 'Unknown'
	| 'Unstarted'
	| 'Material0Round'
	| 'Material1Round'
	| 'Material2Round'
	| 'Product2Round'
	| 'Product3Round'
	| 'Product4Round'
	| 'Public'

export class Company {
	private corp: CorporationInfo | null = null
	private divisionsByType = new Map<string, Division>()
	private state: CompanyState = 'Unknown'
	private developedProduct = false

	get name() {
		return this.corp?.name ?? MyCompany.Name
	}

	get funds() {
		return this.corp?.funds ?? 0
	}

	get corporation() {
		return this.corp
	}

	constructor(private ns: NS) {
		try {
			this.corp = this.ns.corporation.getCorporation()
			this.updateState()
			this.hasDevelopedProduct()
		} catch {
			this.corp = null
			this.state = 'Unstarted'
		}
	}

	updateState() {
		try {
			this.corp = this.ns.corporation.getCorporation()
		} catch {
			this.corp = null
			this.state = 'Unstarted'
			return
		}
		for (const division of this.corp.divisions) {
			this.divisionsByType.set(division.type, division)
		}
		if (this.corp.public) {
			this.state = 'Public'
		} else if (this.divisionsByType.has(MyCompany.ProductDivision.Type)) {
			const nextOffer = this.ns.corporation.getInvestmentOffer()
			switch (nextOffer.round) {
				case 4:
					this.state = 'Product3Round'
					break
				case 3:
					this.state = 'Product2Round'
					break
				default:
					this.state = 'Product4Round'
					break
			}
		} else if (this.divisionsByType.has(MyCompany.MaterialDivision.Type)) {
			const nextOffer = this.ns.corporation.getInvestmentOffer()
			switch (nextOffer.round) {
				case 3:
					this.state = 'Material2Round'
					break
				case 2:
					this.state = 'Material1Round'
					break
				case 1:
					this.state = 'Material0Round'
					break
				default:
					this.state = 'Unknown'
					break
			}
		} else if (this.divisionsByType.size === 0) {
			this.state = 'Unstarted'
		} else {
			this.state = 'Unknown'
		}
	}

	getState() {
		return this.state
	}

	hasMaterialDivision() {
		return this.divisionsByType.has(MyCompany.MaterialDivision.Type)
	}

	getMaterialDivision() {
		return this.divisionsByType.get(MyCompany.MaterialDivision.Type)
	}

	hasProductDivision() {
		return this.divisionsByType.has(MyCompany.ProductDivision.Type)
	}

	getProductDivision() {
		return this.divisionsByType.get(MyCompany.ProductDivision.Type)
	}

	hasDevelopedProduct() {
		const productDivision = this.getProductDivision()
		if (!productDivision) {
			return false
		}
		this.developedProduct ||=
			Boolean(productDivision.products.length) &&
			productDivision.products.some(
				(p) =>
					this.ns.corporation.getProduct(productDivision.name, p)
						.developmentProgress >= 100
			)
		return this.developedProduct
	}
}
