import { Company, ProductDevelopment } from '../../models/corporation'

export class ProductOfficeManager {
	#devStaff = 0
	#researchStaff = 0

	constructor(private readonly company: Company) {}

	summarize() {
		const { logger } = this.company.context
		if (this.company.hasProductDivision()) {
			logger.info`managing product offices; 👩‍🏭 ${this.#devStaff}, 👩‍🎓 ${
				this.#researchStaff
			}`
		}
	}

	manage() {
		if (!this.company.hasProductDivision()) {
			return
		}
		const { ns, logger } = this.company.context
		this.#devStaff = 0
		this.#researchStaff = 0
		const productDivision = this.company.getProductDivision()!
		for (const city of Object.values(ns.enums.CityName)) {
			let office = ns.corporation.getOffice(productDivision.name, city)

			// *** Hire all available staff ***
			while (office.numEmployees < office.size) {
				const employee = ns.corporation.hireEmployee(productDivision.name, city)
				if (employee) {
					office = ns.corporation.getOffice(productDivision.name, city)
				} else {
					logger.warn`unable to hire new employee for ${productDivision.name} in ${city}`
					break
				}
			}

			// *** Assign staff ***
			if (
				office.employeeJobs.Unassigned > 0 ||
				office.employeeJobs.Intern > 0
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
		const { ns } = this.company.context
		// One each in Operations, Engineer, Business, Management; the rest in R&D
		if (
			!ns.corporation.setAutoJobAssignment(
				productDivision.name,
				city,
				'Intern',
				0
			)
		) {
			return
		}
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Business',
			1
		)
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Engineer',
			1
		)
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Management',
			1
		)
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Operations',
			1
		)
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Research & Development',
			office.numEmployees - 4
		)
	}

	private assignProductDevelopmentStaff(
		office: Office,
		productDivision: Division,
		city: CityName
	) {
		const { ns, logger } = this.company.context
		const perTask = office.numEmployees / 3.5
		const assignmentGoals = {
			Operations: Math.floor(perTask),
			Engineer: Math.floor(perTask),
			Business: Math.floor(perTask / 2),
			Management: Math.floor(perTask),
		}
		// prefer assigning extras to Engineering
		const leftover =
			office.numEmployees -
			assignmentGoals.Operations -
			assignmentGoals.Engineer -
			assignmentGoals.Business -
			assignmentGoals.Management
		assignmentGoals.Engineer += leftover
		logger.log(
			`Want to assign: [Ops: ${assignmentGoals.Operations}, Eng: ${assignmentGoals.Engineer}, Bus: ${assignmentGoals.Business}, Man: ${assignmentGoals.Management}]`
		)
		if (
			!ns.corporation.setAutoJobAssignment(
				productDivision.name,
				city,
				'Intern',
				0
			)
		) {
			return
		}
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Operations',
			assignmentGoals.Operations
		)
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Engineer',
			assignmentGoals.Engineer
		)
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Business',
			assignmentGoals.Business
		)
		ns.corporation.setAutoJobAssignment(
			productDivision.name,
			city,
			'Management',
			assignmentGoals.Management
		)
	}
}
