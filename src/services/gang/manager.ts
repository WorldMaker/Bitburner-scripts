import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { toArray } from '@reactivex/ix-esnext-esm/iterable/toarray'
import { ulid } from 'ulid'
import { NsContext } from '../../models/context'
import { AscendThresholds, GangMemberFirstTask } from '../../models/gang'
import { ToyBudgetProvider, ToyPurchaser } from '../../models/toys'

const { from } = IterableX

const GangBudgetThreshold = 10_000_000
const GangBudgetMultiplier = 1 / 3

export class GangManager implements ToyBudgetProvider, ToyPurchaser {
	name = 'gang'
	#gang: GangGenInfo | null = null
	readonly #memberTasks = new Map<string, number>()

	constructor(private readonly context: NsContext) {}

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

		const { ns } = this.context

		const equipment = ns.gang
			.getEquipmentNames()
			.map((name) => [name, ns.gang.getEquipmentCost(name)] as const)

		for (const memberName of ns.gang.getMemberNames()) {
			for (const [name, cost] of equipment) {
				if (cost < budget && ns.gang.purchaseEquipment(memberName, name)) {
					budget -= cost
					return budget
				}
			}
		}

		return budget
	}

	summarize() {
		const { ns, logger } = this.context
		if (this.#gang) {
			const tasks = toArray(
				from(this.#memberTasks.entries()).pipe(
					filter(([, count]) => count > 0),
					map(([task, count]) => `${count} ${task}`)
				)
			).join(', ')
			logger.info`managing ${this.#gang.faction} gang; 🤛 ${ns.formatNumber(
				this.#gang.respect
			)}, ${tasks}`
		} else {
			logger.info`karma ${ns.formatNumber((ns as any).heart?.break?.())}`
		}
	}

	manage() {
		const { ns } = this.context

		this.#memberTasks.clear()

		if (!ns.gang.inGang()) {
			if (!ns.getPlayer().factions.includes(this.context.gangFaction)) {
				return
			}
			if (!ns.gang.createGang(this.context.gangFaction)) {
				return
			}
		}

		this.#gang = ns.gang.getGangInformation()

		if (ns.gang.canRecruitMember()) {
			const name = ulid()
			if (ns.gang.recruitMember(name)) {
				ns.gang.setMemberTask(name, GangMemberFirstTask)
			}
		}

		for (const memberName of ns.gang.getMemberNames()) {
			const member = ns.gang.getMemberInformation(memberName)
			const ascension = ns.gang.getAscensionResult(memberName)

			if (
				ascension &&
				(ascension.agi - member.agi_asc_mult > AscendThresholds.agi ||
					ascension.def - member.def_asc_mult > AscendThresholds.def ||
					ascension.dex - member.dex_asc_mult > AscendThresholds.dex ||
					ascension.str - member.str_asc_mult > AscendThresholds.str)
			) {
				ns.gang.ascendMember(memberName)
			}

			const count = this.#memberTasks.get(member.task) ?? 0
			this.#memberTasks.set(member.task, count + 1)
		}
	}
}
