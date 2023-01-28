import { SleevePosition } from '../models/shirt'

export class ShirtService {
	private sleeves: SleevePosition[]

	constructor(private ns: NS) {
		this.sleeves = this.updateSleeves()
	}

	private updateSleeves() {
		this.sleeves = Array.from(
			{ length: this.ns.sleeve.getNumSleeves() },
			(_, k) => new SleevePosition(this.ns, k)
		)
		return this.sleeves
	}

	getSleeves() {
		return this.sleeves
	}

	summarize() {
		return `INFO managing ${this.sleeves.length} sleeves; ${this.sleeves
			.map((s) => s.getState())
			.join('')}`
	}

	manage() {
		this.updateSleeves()

		for (const sleeve of this.sleeves) {
			sleeve.nextStep()
		}
	}
}
