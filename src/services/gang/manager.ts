import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { toArray } from '@reactivex/ix-esnext-esm/iterable/toarray'
import { ulid } from 'ulid'
import { NsLogger } from '../../logging/logger'
import { Config } from '../../models/config'
import { AscendThresholds, GangMemberFirstTask } from '../../models/gang'
import { ToyBudgetProvider, ToyPurchaser } from '../../models/toys'

const { from } = IterableX

const GangBudgetThreshold = 10_000_000
const GangBudgetMultiplier = 1 / 3

export class GangManager implements ToyBudgetProvider, ToyPurchaser {
	name = 'gang'
	#gang: GangGenInfo | null = null
	readonly #memberTasks = new Map<string, number>()

	constructor(
		private readonly ns: NS,
		private readonly config: Config,
		private readonly logger: NsLogger
	) {}

	budget(funds: number): number {
		if (!this.#gang) {
			return 0
		}

		if (funds < GangBudgetThreshold) {
			return 0
		}

		const budget = this.#gang.moneyGainRate * GangBudgetMultiplier
		if (budget >= funds) {
			return 0
		}
		return budget
	}

	purchase(budget: number): number {
		if (!this.#gang) {
			return budget
		}

		const equipment = this.ns.gang
			.getEquipmentNames()
			.map((name) => [name, this.ns.gang.getEquipmentCost(name)] as const)

		for (const memberName of this.ns.gang.getMemberNames()) {
			for (const [name, cost] of equipment) {
				if (cost < budget && this.ns.gang.purchaseEquipment(memberName, name)) {
					budget -= cost
					return budget
				}
			}
		}

		return budget
	}

	summarize() {
		if (this.#gang) {
			const tasks = toArray(
				from(this.#memberTasks.entries()).pipe(
					filter(([, count]) => count > 0),
					map(([task, count]) => `${count} ${task}`)
				)
			).join(', ')
			this.logger.info`managing ${
				this.#gang.faction
			} gang; 🤛 ${this.ns.formatNumber(this.#gang.respect)}, ${tasks}`
		} else {
			this.logger.info`karma ${this.ns.formatNumber(
				(this.ns as any).heart?.break?.()
			)}`
		}
	}

	manage() {
		this.#memberTasks.clear()

		if (!this.ns.gang.inGang()) {
			if (!this.ns.getPlayer().factions.includes(this.config.gangFaction)) {
				return
			}
			if (!this.ns.gang.createGang(this.config.gangFaction)) {
				return
			}
		}

		this.#gang = this.ns.gang.getGangInformation()

		if (this.ns.gang.canRecruitMember()) {
			const name = ulid()
			if (this.ns.gang.recruitMember(name)) {
				this.ns.gang.setMemberTask(name, GangMemberFirstTask)
			}
		}

		for (const memberName of this.ns.gang.getMemberNames()) {
			const member = this.ns.gang.getMemberInformation(memberName)
			const ascension = this.ns.gang.getAscensionResult(memberName)

			if (
				ascension &&
				(ascension.agi - member.agi_asc_mult > AscendThresholds.agi ||
					ascension.def - member.def_asc_mult > AscendThresholds.def ||
					ascension.dex - member.dex_asc_mult > AscendThresholds.dex ||
					ascension.str - member.str_asc_mult > AscendThresholds.str)
			) {
				this.ns.gang.ascendMember(memberName)
			}

			const count = this.#memberTasks.get(member.task) ?? 0
			this.#memberTasks.set(member.task, count + 1)
		}
	}
}
