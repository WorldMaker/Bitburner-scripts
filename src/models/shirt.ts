export function getSleeveState(sleeve: SleevePerson, task?: SleeveTask | null) {
	if (sleeve.shock > 0) {
		return '💤'
	}
	if (sleeve.sync < 100) {
		return '🔁'
	}
	if (task) {
		switch (task.type) {
			case 'RECOVERY':
				return '😴'
			case 'SYNCHRO':
				return '✔'
			case 'CRIME':
				return '🦝'
			case 'INFILTRATE':
				return '🦹‍♀️'
			case 'CLASS':
				return '👩‍🎓'
			case 'COMPANY':
				return '👷‍♀️'
			case 'FACTION':
				return '💻'
		}
	}
	return '❓'
}

export type SleeveState = ReturnType<typeof getSleeveState>

export class SleevePosition {
	private state: SleeveState
	private person: SleevePerson
	private task?: SleeveTask | null

	constructor(private ns: NS, public readonly id: number) {
		this.person = this.ns.sleeve.getSleeve(id)
		this.task = this.ns.sleeve.getTask(id)
		this.state = getSleeveState(this.person, this.task)
	}

	getState() {
		return this.state
	}

	getPerson() {
		return this.person
	}

	getTask() {
		return this.task
	}

	recover() {
		return this.ns.sleeve.setToShockRecovery(this.id)
	}

	sync() {
		return this.ns.sleeve.setToSynchronize(this.id)
	}

	heist() {
		return this.ns.sleeve.setToCommitCrime(this.id, 'Heist')
	}

	nextStep() {
		switch (this.state) {
			case '💤':
				return this.recover()
			case '✔':
				return this.heist()
			case '😴':
				if (this.person.sync < 100) {
					return this.sync()
				}
				return this.heist()
			case '🦝':
				return true
			default:
				return this.heist()
		}
	}
}
