import { Company, ProductDevelopment } from '../../models/corporation'
import { ProductPriceCache } from './product-price-cache'

export class ProductPriceService {
	private priceCache: ProductPriceCache | null = null

	constructor(private ns: NS, private company: Company) {
		const productDivision = this.company.getProductDivision()
		if (productDivision) {
			if (
				!this.ns.corporation.hasResearched(
					productDivision.name,
					ProductDevelopment.KeyResearch
				)
			) {
				this.priceCache = new ProductPriceCache(this.ns, productDivision)
			}
		}
	}

	summarize() {
		if (this.priceCache) {
			return `INFO managing product prices`
		}
		return `INFO not managing product prices`
	}

	manage() {
		const productDivision = this.company.getProductDivision()

		if (!productDivision) {
			this.priceCache = null
			return
		}

		if (
			this.ns.corporation.hasResearched(
				productDivision.name,
				ProductDevelopment.KeyResearch
			)
		) {
			this.priceCache = null
			return
		}

		if (!this.priceCache) {
			this.priceCache = new ProductPriceCache(this.ns, productDivision)
		}

		for (const productName of productDivision.products) {
			const product = this.ns.corporation.getProduct(
				productDivision.name,
				productName
			)
			const price = this.priceCache.getProductPrice(product)
			this.ns.print(
				`${productName} is ${price.getState()} priced at MP*${price.getMultiplier()}`
			)
		}
	}
}
