import { ProductPrice } from '../../models/product'

export class ProductPriceCache {
	private cache = new Map<string, ProductPrice>()

	constructor(private ns: NS, private productDivision: Division) {}

	getProductPrice(product: Product): ProductPrice {
		let price = this.cache.get(product.name)
		if (price) {
			price.update(product)
		} else {
			price = new ProductPrice(this.ns, this.productDivision, product)
			this.cache.set(product.name, price)
		}
		return price
	}
}
