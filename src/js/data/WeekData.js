class WeekData {
	constructor(weekNumber, mondayOfWeek) {
		this.weekNumber = weekNumber;
		this.mondayOfWeek = mondayOfWeek;
		this.employees = [];
	}

	regexEmail(email) {
		const regex = /(.+)(@valtech)\./;
		const matches = email.match(regex);
		if (matches) {
			return matches[1] + matches[2];
		}
		return null;
	}

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
}