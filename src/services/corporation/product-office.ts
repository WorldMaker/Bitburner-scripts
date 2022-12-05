import { IterableX } from '@reactivex/ix-esnext-esm/iterable/iterablex'
import { filter } from '@reactivex/ix-esnext-esm/iterable/operators/filter'
import { map } from '@reactivex/ix-esnext-esm/iterable/operators/map'
import { Cities, Company, ProductDevelopment } from '../../models/corporation'
import { Logger } from '../../models/logger'

const { from } = IterableX

export class ProductOfficeManager {
	constructor(
		private ns: NS,
		private logger: Logger,
		private company: Company
	) {}

	summarize() {
		if (this.company.hasProductDivision()) {
			return `INFO managing product offices`
		}
		return `INFO no product offices to manage`
	}

	manage() {
		if (!this.company.hasProductDivision()) {
			return
		}
		const productDivision = this.company.getProductDivision()!
		for (const city of Cities) {
			let office = this.ns.corporation.getOffice(productDivision.name, city)

			// *** Hire all available staff ***
			while (office.employees.length < office.size) {
				const employee = this.ns.corporation.hireEmployee(
					productDivision.name,
					city
				)
				if (employee) {
					office = this.ns.corporation.getOffice(productDivision.name, city)
				} else {
					this.logger.log(
						`WARN unable to hire new employee for ${productDivision.name} in ${city}`
					)
					break
				}
			}

			const unassigned = [
				...from(office.employees).pipe(
					map((name) =>
						this.ns.corporation.getEmployee(productDivision.name, city, name)
					),
					filter((e) => e.pos === 'Unassigned'),
					map((e) => e.name)
				),
			]

			if (unassigned.length !== office.employeeJobs.Unassigned) {
				this.logger.log(
					`WARN unassigned employees for ${productDivision.name} in ${city} does not match ${unassigned.length}/${office.employeeJobs.Unassigned}`
				)
			}

			// *** Assign staff ***
			if (unassigned.length) {
				if (city === ProductDevelopment.City) {
					office = this.assignProductDevelopmentStaff(
						office,
						unassigned,
						productDivision,
						city
					)
				} else {
					this.assignResearchStaff(office, unassigned, productDivision, city)
				}
			}
		}
	}

	private assignResearchStaff(
		office: Office,
		unassigned: string[],
		productDivision: Division,
		city: string
	) {
		// One each in Operations, Engineer, Business, Management; the rest in R&D
		if (office.employeeJobs.Business < 1 && unassigned.length) {
			this.ns.corporation.assignJob(
				productDivision.name,
				city,
				unassigned.shift()!,
				'Business'
			)
		}
		if (office.employeeJobs.Engineer < 1 && unassigned.length) {
			this.ns.corporation.assignJob(
				productDivision.name,
				city,
				unassigned.shift()!,
				'Engineer'
			)
		}
		if (office.employeeJobs.Management < 1 && unassigned.length) {
			this.ns.corporation.assignJob(
				productDivision.name,
				city,
				unassigned.shift()!,
				'Management'
			)
		}
		if (office.employeeJobs.Operations < 1 && unassigned.length) {
			this.ns.corporation.assignJob(
				productDivision.name,
				city,
				unassigned.shift()!,
				'Operations'
			)
		}
		while (unassigned.length) {
			this.ns.corporation.assignJob(
				productDivision.name,
				city,
				unassigned.shift()!,
				'Research & Development'
			)
		}
	}

	private assignProductDevelopmentStaff(
		office: Office,
		unassigned: string[],
		productDivision: Division,
		city: string
	) {
		const perTask = office.size / 3.5
		const assignmentGoals = {
			Operations: perTask,
			Engineer: perTask,
			Business: perTask / 2,
			Management: perTask,
		}
		while (unassigned.length) {
			if (office.employeeJobs.Operations < assignmentGoals.Operations) {
				this.ns.corporation.assignJob(
					productDivision.name,
					city,
					unassigned.shift()!,
					'Operations'
				)
			} else if (office.employeeJobs.Engineer < assignmentGoals.Engineer) {
				this.ns.corporation.assignJob(
					productDivision.name,
					city,
					unassigned.shift()!,
					'Engineer'
				)
			} else if (office.employeeJobs.Business < assignmentGoals.Business) {
				this.ns.corporation.assignJob(
					productDivision.name,
					city,
					unassigned.shift()!,
					'Business'
				)
			} else if (office.employeeJobs.Management < assignmentGoals.Management) {
				this.ns.corporation.assignJob(
					productDivision.name,
					city,
					unassigned.shift()!,
					'Management'
				)
			} else {
				// Assign leftovers to Engineer
				this.ns.corporation.assignJob(
					productDivision.name,
					city,
					unassigned.shift()!,
					'Engineer'
				)
			}

			office = this.ns.corporation.getOffice(productDivision.name, city)
		}
		return office
	}
}
