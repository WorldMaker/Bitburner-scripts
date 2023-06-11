import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { orderBy } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { ulid } from 'ulid'
import {
	Company,
	MyCompany,
	ProductDevelopment,
} from '../../models/corporation'

const { from } = IterableX

export class ProductManager {
	#developmentProducts: Product[] = []

	constructor(private readonly company: Company) {}

	summarize() {
		const { logger } = this.company.context
		if (this.company.hasProductDivision()) {
			const development = this.#developmentProducts
				.map(
					(product) =>
						`⚒ ${(product.developmentProgress / 100).toLocaleString(undefined, {
							style: 'percent',
						})}`
				)
				.join(', ')
			logger.info`managing products; ${development}`
		}
	}

	manage() {
		if (!this.company.hasProductDivision()) {
			return
		}
		const { ns, logger } = this.company.context
		const productDivision = this.company.getProductDivision()!

		const products = from(productDivision.products).pipe(
			map((product) =>
				ns.corporation.getProduct(
					productDivision.name,
					ProductDevelopment.City,
					product
				)
			)
		)

		this.#developmentProducts = [
			...products.pipe(filter((product) => product.developmentProgress < 100)),
		]

		const productionProducts = [
			...products.pipe(
				filter((product) => product.developmentProgress >= 100),
				orderBy((product) => product.rating)
			),
		]

		// *** Start Development of new Products ***
		// If there is no product in development, make one; discontinue the lowest rated existing product if necessary

		if (this.#developmentProducts.length < 1) {
			if (productionProducts.length >= productDivision.maxProducts) {
				const discontinuedProduct = productionProducts.shift()!
				ns.corporation.discontinueProduct(
					productDivision.name,
					discontinuedProduct.name
				)
			}
			try {
				ns.corporation.makeProduct(
					productDivision.name,
					ProductDevelopment.City,
					`${MyCompany.ProductDivision.ProductBaseName}-${ulid()}`,
					MyCompany.ProductDivision.DesignInvestment,
					MyCompany.ProductDivision.MarketingInvestment
				)
			} catch (err) {
				logger.warn`unable to make product: ${err}`
			}
		}

		// *** Make sure all current production products are for sale ***

		for (const product of productionProducts) {
			if (product.desiredSellPrice === 0 || product.desiredSellPrice === '') {
				ns.corporation.sellProduct(
					productDivision.name,
					ProductDevelopment.City,
					product.name,
					'MAX',
					'MP',
					true
				)
				try {
					ns.corporation.setProductMarketTA2(
						productDivision.name,
						product.name,
						true
					)
				} catch (error) {
					logger.warn`error setting Material TA-2: ${error}`
				}
			}
		}
	}
}
