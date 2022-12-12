import { ProductDevelopment } from './corporation'

export type ProductPriceState =
	| 'Developing'
	| 'Seeking'
	| 'Bisecting'
	| 'Watching'

const MarketPriceMultiplierRegex = /MP\*(?<multiplier>\d+)/
const AdjustmentTime = 10 /* min */ * 60 /* s */ * 1000 /* ms */
const SellAll = 'MAX'

export class ProductPrice {
	private state: ProductPriceState
	private multiplier = 1
	private multiplierMinimum = 1
	private multiplierMaximum = 1
	private lastChecked = new Date()

	get name() {
		return this.product.name
	}

	constructor(
		private ns: NS,
		private productDivision: Division,
		private product: Product
	) {
		if (this.product.developmentProgress < 100) {
			this.state = 'Developing'
		} else if (this.product.sCost === 'MP' || this.product.sCost === 'MP*1') {
			this.state = 'Seeking'
		} else {
			this.state = 'Watching'
			if (typeof this.product.sCost === 'string') {
				// dumb way to call RegEx 'exec' because it was getting clbuttic read as ns.exec by memory checks
				const match = MarketPriceMultiplierRegex['exec'](this.product.sCost)
				if (match) {
					this.multiplier = parseInt(match.groups?.['multiplier'] ?? '1', 10)
				}
			}
		}
	}

	getMultiplier() {
		return this.multiplier
	}

	getState() {
		return this.state
	}

	update(product: Product) {
		this.product = product
		if (this.product.developmentProgress < 100) {
			this.state = 'Developing'
			this.multiplier = 1
			return
		}
		const [_quantity, production, sell] =
			this.product.cityData[ProductDevelopment.City]
		switch (this.state) {
			case 'Developing':
				this.state = 'Seeking'
			// intentional fallthrough
			case 'Seeking':
				if (production <= sell) {
					this.multiplier *= 2
				} else {
					this.state = 'Bisecting'
					this.multiplierMinimum = this.multiplier / 2
					this.multiplierMaximum = this.multiplier
					this.multiplier =
						(this.multiplierMinimum + this.multiplierMaximum) / 2
				}
				this.ns.corporation.sellProduct(
					this.productDivision.name,
					ProductDevelopment.City,
					this.product.name,
					SellAll,
					`MP*${this.multiplier}`,
					true
				)
				break
			case 'Bisecting':
				if (production <= sell) {
					this.multiplierMinimum = this.multiplier
				} else {
					this.multiplierMaximum = this.multiplier
				}

				if (this.multiplierMaximum - this.multiplierMinimum > 0.5) {
					this.multiplier =
						(this.multiplierMinimum + this.multiplierMaximum) / 2
				} else {
					this.state = 'Watching'
					this.multiplier = Math.floor(this.multiplierMinimum)
				}
				this.ns.corporation.sellProduct(
					this.productDivision.name,
					ProductDevelopment.City,
					this.product.name,
					SellAll,
					`MP*${this.multiplier}`,
					true
				)
				break
			case 'Watching':
				if (this.lastChecked.getTime() - Date.now() >= AdjustmentTime) {
					if (production < sell) {
						this.multiplier = Math.max(1, this.multiplier - 1)
					} else if (production > sell) {
						this.multiplier++
					}
					this.ns.corporation.sellProduct(
						this.productDivision.name,
						ProductDevelopment.City,
						this.product.name,
						SellAll,
						`MP*${this.multiplier}`,
						true
					)
					this.lastChecked = new Date()
				}
				break
		}
	}
}
