import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { orderBy } from '@reactivex/ix-esnext-esm/iterable/operators/orderby'
import { ulid } from 'ulid'
import {
	Company,
	MyProductBaseName,
	ProductDevelopmentCity,
} from '../../models/corporation'

const { from } = IterableX

const DesignInvestment = 1_000_000_000_000
const MarketingInvestment = 1_000_000_000_000
const TotalProducts = 3

export class ProductManager {
	constructor(private ns: NS, private company: Company) {}

	summarize() {
		if (this.company.hasProductDivision()) {
			return `INFO managing products`
		} else {
			return `INFO no product division to manage`
		}
	}

	manage() {
		if (!this.company.hasProductDivision()) {
			return
		}
		const productDivision = this.company.getProductDivision()!

		const products = from(productDivision.products).pipe(
			map((product) =>
				this.ns.corporation.getProduct(productDivision.name, product)
			)
		)

		const developmentProducts = [
			...products.pipe(filter((product) => product.developmentProgress < 100)),
		]

		const productionProducts = [
			...products.pipe(
				filter((product) => product.developmentProgress >= 100),
				orderBy((product) => product.rat)
			),
		]

		// *** Start Development of new Products ***
		// If there is no product in development, make one; discontinue the lowest rated existing product if necessary

		if (developmentProducts.length < 1) {
			if (productionProducts.length >= TotalProducts) {
				const discontinuedProduct = productionProducts.shift()!
				this.ns.corporation.discontinueProduct(
					productDivision.name,
					discontinuedProduct.name
				)
			}
			this.ns.corporation.makeProduct(
				productDivision.name,
				ProductDevelopmentCity,
				`${MyProductBaseName}-${ulid()}`,
				DesignInvestment,
				MarketingInvestment
			)
		}

		// *** Make sure all current production products are for sale ***

		for (const product of productionProducts) {
			if (product.sCost === 0 || product.sCost === '') {
				this.ns.corporation.sellProduct(
					productDivision.name,
					ProductDevelopmentCity,
					product.name,
					'MAX',
					'MP',
					true
				)
			}
		}
	}
}