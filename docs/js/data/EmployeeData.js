// Init weight scores range, min and max values for happiness and business axis
const happinessHealthScores = [-2, -1, 0, 1, 2];
const businessHealthScores = [-2, -1, 0, -1, -2];
const minHappinessHealthScore = Math.min(...happinessHealthScores);
const minBusinessHealthScore = Math.min(...businessHealthScores);
const minHealthScore = minHappinessHealthScore + minBusinessHealthScore;
const maxHappinessHealthScore = Math.max(...happinessHealthScores);
const maxBusinessHealthScore = Math.max(...businessHealthScores);
const maxHealthScore = maxHappinessHealthScore + maxBusinessHealthScore;

// Init name insertions
const knownInsertions = ['de', 'den', 'der', 'van', 'vd', 'op', 't', 'vande', 'vanden', 'vander', 'opt'];

class EmployeeData {
		/**
	 * @param {string} email Email address of the employee
	 * @param {number} businessScore Business value based on 1 to 5 range
	 * @param {number} happinessScore Happiness value based on 1 to 5 range
	 * @param {string} answer Answer to form question
	 * @param {boolean} isMissingEntry Boolean indicating if instance represents an expected yet absent submission, optional and used in class only, use method copyAsMissing instead
	 * @param {number} missedEntries Number identifing instance copy count, optional and used in class only, use method copyAsMissing instead
	 */
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

		// determines if instance is copied more then a maximum, expired entries are not shown by default
		this.isExpired = this.missedEntries > 8;
	}

	/**
	 * Initialization of name initials and processed health score
	 * @returns {EmployeeData} This instance
	 */
	init() {
		this.initials = this.getInitials();
		this.health = this.getHealthScore();
		return this;
	}

	/**
	 * @returns {EmployeeData} Copy of current instance as missing entry and incrementing missingEntries count
	 */
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

	/**
	 * @returns {Array<string>} Name based on email in parts seperated by '.'
	 */
	getNameInParts() {
		return this.email.split('@')[0].split('.');
	}

	/**
	 * @returns {string} First name
	 */
	getFirstName() {
		const nameInParts = this.getNameInParts();
		const firstLetter = nameInParts[0].charAt(0).toUpperCase();
		return firstLetter + nameInParts[0].slice(1);
	}
	
	/**
	 * @returns {Array<string>} All found name insertions
	 */
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

	/**
	 * @returns {Array<string>} All last names
	 */
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

	/**
	 * @returns {string} First letter of first name, all insertions and the first last name
	 */
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

	/**
	 * @returns {string} Full name
	 */
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

	/**
	 * @returns {string} Color value based on health score
	 */
	getColor() {
		if (this.email === 'Average') { return '#60aaff' }
		// https://gka.github.io/palettes/#colors=#fc0,green|steps=4|bez=1|coL=1
		// https://gka.github.io/palettes/#colors=#c00,#fc0|steps=4|bez=1|coL=1
		const colors = ['#cc0000','#cc0000', '#de5700','#f9b200','#b9b400','#669700','#008000'];
		return colors[this.health - minHealthScore];
	}
}
