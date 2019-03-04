class Employee {
	constructor(email) {
		this.email = email;
		this.weekDataSets = [];
	}

	getWeekData(weekNr) {
		return this.weekDataSets.find((weekDataSet) => {
			return weekDataSet.weekNr === weekNr;
		});
	}

	getLastEntry(weekNr) {
		const startIndex = this.weekDataSets.indexOf(this.getWeekData(weekNr));
		const maxMissedEntries = 8;

		for (let i = 0; (i < maxMissedEntries || startIndex - 1 < 0); i++) {
			const weekDataSet = this.weekDataSets[startIndex - i];
			if (!weekDataSet.isMissingEntry) {
				return weekDataSet;
			}
		}
		return undefined;
	}

	addWeekDataSet(weekNr, happinessScore, businessScore, isMissingEntry = false) {
		this.weekDataSets.push({
			weekNr: weekNr,
			happinessScore: happinessScore,
			businessScore: businessScore,
			isMissingEntry: isMissingEntry
		});
	}

	overrideWeekDataSet(weekNr, happinessScore, businessScore) {
		const index = this.weekDataSets.indexOf(
			this.weekDataSets.find((dataSet) => {
				return dataSet.weekNr === weekNr;
			})
		);
		this.weekDataSets[index] = {
			weekNr: weekNr,
			happinessScore: happinessScore,
			businessScore: businessScore,
			isMissingEntry: false
		}
	}
}