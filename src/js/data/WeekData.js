class WeekData {
	constructor(weekNumber, year, mondayOfWeek) {
		this.weekNumber = weekNumber;
		this.year = year;
		this.mondayOfWeek = mondayOfWeek;
		this.employees = [];

		//console.log(this);
	}

	/**
	 * Matches string to the valtech email pattern, ignoring .nl/.com
	 * @param {string} email Email to match
	 * @returns {string} Email if matched, null if not
	 */
	regexEmail(email) {
		const regex = /(.+)(@valtech)\./;
		const matches = email.match(regex);
		if (matches) {
			return matches[1] + matches[2];
		}
		return null;
	}

	/**
	 * Adds employee object instance to weekdata based on provided data, overwrites instances with identical email
	 * @param {Array} employeeRow Data set based on form sheet row
	 * @returns {undefined}
	 */
	addEmployee(employeeRow) {
		// const fields = {
		// 	timestamp: 0,
		// 	email: 1,
		// 	name: 2,
		// 	happiness: 3,
		// 	business: 4,
		// 	formQuestion: 5
		// }

		const fields = {
			email: employeeRow[1],
			happiness: +employeeRow[3],
			business: +employeeRow[4],
			formQuestion: employeeRow[5]
		}

		const matchedEmail = this.regexEmail(fields.email);
		if (matchedEmail) {
			const employeeExisting = this.employees.find((employee) => {
				return employee.email === matchedEmail;
			});
			
			if (employeeExisting) {
				const index = this.employees.indexOf(employeeExisting);
				this.employees[index] = new EmployeeData(
					matchedEmail,
					fields.business,
					fields.happiness,
					fields.formQuestion
				).init();
			} else {
				this.employees.push(new EmployeeData(
					matchedEmail,
					fields.business,
					fields.happiness,
					fields.formQuestion
				).init());
			}
		}
	}

	addAverage() {
		this.employees = this.employees.filter((employee) => {
			return employee.email !== 'Average';
		})

		let validEntries = 0;
		let totalHappiness = 0;
		let totalBusiness = 0;
		this.employees.forEach((employee) => {
			if (!employee.isMissingEntry) {
				validEntries++;
				totalHappiness += employee.happinessScore;
				totalBusiness += employee.businessScore;
			}
		})
		 
		this.employees.push(new EmployeeData(
			undefined,
			Math.round(totalBusiness / validEntries),
			Math.round(totalHappiness / validEntries)
		))
	};
}
