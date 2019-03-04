const happinessHealthScores = [-2, -1, 0, 1, 2];
const businessHealthScores = [-2, -1, 0, -1, -2];
const minHappinessHealthScore = Math.min(...happinessHealthScores);
const minBusinessHealthScore = Math.min(...businessHealthScores);
const minHealthScore = minHappinessHealthScore + minBusinessHealthScore;
const maxHappinessHealthScore = Math.max(...happinessHealthScores);
const maxBusinessHealthScore = Math.max(...businessHealthScores);
const maxHealthScore = maxHappinessHealthScore + maxBusinessHealthScore;

const knownInsertions = ['de', 'den', 'der', 'van', 'vd', 'op', 't', 'vande', 'vanden', 'vander', 'opt'];

class EmployeeData {
	constructor(email, businessScore, happinessScore, answer = '', isMissingEntry = false, missedEntries = 0) {
		if (email === undefined) {
			this.email = 'Average'
		} else {
			this.email = email;
		}
		this.businessScore = businessScore;
		this.happinessScore = happinessScore;
		this.answer = answer;

		this.isMissingEntry = isMissingEntry;
		this.missedEntries = missedEntries;
		this.isExpired = this.missedEntries > 8;
	}

	init() {
		this.initials = this.getInitials();
		this.health = this.getHealthScore();
		return this;
	}

	copyAsMissing() {
		return new EmployeeData(
			this.email,
			this.businessScore,
			this.happinessScore,
			'',
			true,
			this.missedEntries += 1
		).init();
	}

	getNameInParts() {
		return this.email.split('@')[0].split('.');
	}

	getFirstName() {
		const nameInParts = this.getNameInParts();
		const firstLetter = nameInParts[0].charAt(0).toUpperCase();
		return firstLetter + nameInParts[0].slice(1);
	}
	
	getInsertions() {
		const nameInParts = this.getNameInParts();
		const middleNames = [];
		nameInParts.forEach((part) => {
			if (knownInsertions.indexOf(part) !== -1) {
				middleNames.push(part.toLowerCase());
			}
		});
		if (middleNames.length < 1) {
			return [''];
		}
		return middleNames;
	}

	getLastNames() {
		const lastNameParts = this.getNameInParts().slice(1);
		const lastNames = [];
		lastNameParts.forEach((part) => {
			if (knownInsertions.indexOf(part) === -1) {
				const firstLetter = part.charAt(0).toUpperCase();
				lastNames.push(firstLetter + part.slice(1));
			}
		});
		if (lastNames.length < 1) {
			return [''];
		}
		return lastNames;
	}

	getInitials() {
		if (this.email === 'Average') {	return 'Avg' }

		const firstName = this.getFirstName();
		const middleNames = this.getInsertions();
		const lastNames = this.getLastNames();
		
		let initials = firstName.charAt(0);
		middleNames.forEach((part) => {
			initials += part.charAt(0);
		});
		initials += lastNames[0].charAt(0);

		return initials;
	}

	getNeatName() {
		if (this.email === 'Average') { return this.email }
		const firstName = this.getFirstName();
		const middleNames = this.getInsertions();
		const lastNames = this.getLastNames();

		if (middleNames[0] === '') {
			return `${firstName} ${lastNames.join(' ')}`;
		}
		return `${firstName} ${middleNames.join(' ')} ${lastNames.join(' ')}`
	}

	/**
	* get an employee's health score
	* @returns {number}
	*/
	getHealthScore() {
		return businessHealthScores[this.businessScore - 1] + happinessHealthScores[this.happinessScore - 1];
	}

	getColor() {
		if (this.email === 'Average') { return '#60aaff' }
		// https://gka.github.io/palettes/#colors=#fc0,green|steps=4|bez=1|coL=1
		// https://gka.github.io/palettes/#colors=#c00,#fc0|steps=4|bez=1|coL=1
		const colors = ['#cc0000','#cc0000', '#de5700','#f9b200','#b9b400','#669700','#008000'];
		return colors[this.health - minHealthScore];
	}
}
