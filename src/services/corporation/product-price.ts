import { Company, ProductDevelopment } from '../../models/corporation'
import { ProductPrice } from '../../models/product'
import { ProductPriceCache } from './product-price-cache'

export class ProductPriceService {
	private priceCache: ProductPriceCache | null = null
	private readonly prices: ProductPrice[] = []

	constructor(private readonly company: Company) {
		const { ns } = this.company.context
		const productDivision = this.company.getProductDivision()
		if (productDivision) {
			if (
				!ns.corporation.hasResearched(
					productDivision.name,
					ProductDevelopment.KeyResearch
				)
			) {
				this.priceCache = new ProductPriceCache(ns, productDivision)
			}
		}
	}

	summarize() {
		const { logger } = this.company.context
		if (this.priceCache) {
			const prices = this.prices
				.map((price) => `${price.getStateEmoji()} ${price.getMultiplier()}`)
				.join(', ')
			logger.info`managing product prices; ${prices}`
		}
	}

	manage() {
		const { ns, logger } = this.company.context
		this.company.updateState()
		const productDivision = this.company.getProductDivision()

		this.prices.splice(0, this.prices.length)

		if (!productDivision) {
			this.priceCache = null
			return
		}

		if (
			ns.corporation.hasResearched(
				productDivision.name,
				ProductDevelopment.KeyResearch
			)
		) {
			this.priceCache = null
			return
		}

		if (!this.priceCache) {
			this.priceCache = new ProductPriceCache(ns, productDivision)
		}

		for (const productName of productDivision.products) {
			const product = ns.corporation.getProduct(
				productDivision.name,
				ProductDevelopment.City,
				productName
			)
			const price = this.priceCache.getProductPrice(product)
			this.prices.push(price)
			logger.trace`${price.getState()} ${productName} price at MP*${price.getMultiplier()}`
		}
	}
}
