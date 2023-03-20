import { Company, ProductDevelopment } from '../../models/corporation'
import { NsLogger } from '../../logging/logger'

export class ProductOfficeManager {
	#devStaff = 0
	#researchStaff = 0

	constructor(
		private ns: NS,
		private logger: NsLogger,
		private company: Company
	) {}

	summarize() {
		if (this.company.hasProductDivision()) {
			this.logger.info`managing product offices; 👩‍🏭 ${this.#devStaff}, 👩‍🎓 ${
				this.#researchStaff
			}`
		}
	}

	manage() {
		if (!this.company.hasProductDivision()) {
			return
		}
		this.#devStaff = 0
		this.#researchStaff = 0
		const productDivision = this.company.getProductDivision()!
		for (const city of Object.values(this.ns.enums.CityName)) {
			let office = this.ns.corporation.getOffice(productDivision.name, city)

			// *** Hire all available staff ***
			while (office.employees < office.size) {
				const employee = this.ns.corporation.hireEmployee(
					productDivision.name,
					city
				)
				if (employee) {
					office = this.ns.corporation.getOffice(productDivision.name, city)
				} else {
					this.logger
						.warn`unable to hire new employee for ${productDivision.name} in ${city}`
					break
				}
			}

			// *** Assign staff ***
			if (
				office.employeeJobs.Unassigned > 0 ||
				office.employeeJobs.Training > 0
			) {
				if (city === ProductDevelopment.City) {
					this.assignProductDevelopmentStaff(office, productDivision, city)
				} else {
					this.assignResearchStaff(office, productDivision, city)
				}
			}

			if (city === ProductDevelopment.City) {
				this.#devStaff += office.size
			} else {
				this.#researchStaff += office.size
			}
		}
	}

	private assignResearchStaff(
		office: Office,
		productDivision: Division,
		city: CityName
	) {
		// One each in Operations, Engineer, Business, Management; the rest in R&D
		if (
			!this.ns.corporation.setAutoJobAssignment(
				productDivision.name,
				city,
				'Training',
				0
			)
		) {
			return
		}
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Business',
			1
		)
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Engineer',
			1
		)
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Management',
			1
		)
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Operations',
			1
		)
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Research & Development',
			office.employees - 4
		)
	}

	private assignProductDevelopmentStaff(
		office: Office,
		productDivision: Division,
		city: CityName
	) {
		const perTask = office.employees / 3.5
		const assignmentGoals = {
			Operations: Math.floor(perTask),
			Engineer: Math.floor(perTask),
			Business: Math.floor(perTask / 2),
			Management: Math.floor(perTask),
		}
		// prefer assigning extras to Engineering
		const leftover =
			office.employees -
			assignmentGoals.Operations -
			assignmentGoals.Engineer -
			assignmentGoals.Business -
			assignmentGoals.Management
		assignmentGoals.Engineer += leftover
		this.logger.log(
			`Want to assign: [Ops: ${assignmentGoals.Operations}, Eng: ${assignmentGoals.Engineer}, Bus: ${assignmentGoals.Business}, Man: ${assignmentGoals.Management}]`
		)
		if (
			!this.ns.corporation.setAutoJobAssignment(
				productDivision.name,
				city,
				'Training',
				0
			)
		) {
			return
		}
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Operations',
			assignmentGoals.Operations
		)
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Engineer',
			assignmentGoals.Engineer
		)
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Business',
			assignmentGoals.Business
		)
		this.ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Management',
			assignmentGoals.Management
		)
	}
}
