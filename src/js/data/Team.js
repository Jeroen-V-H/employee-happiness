class Team {
	constructor(name) {
		this.name = name;
		this.emails = [];
	}

	//HACK: Duplicated code from Weekdata class
	regexEmail(email) {
		const regex = /(.+)(@valtech)\./;
		const matches = email.match(regex);
		if (matches) {
			return matches[1] + matches[2];
		}
		return null;
	}

	addEmail(email) {
		const matchedEmail = this.regexEmail(email);
		if (matchedEmail && this.emails.indexOf(matchedEmail) === -1) {
			this.emails.push(matchedEmail);
		}
	}

	hasEmail(email) {
		return this.emails.indexOf(email) !== -1;
	}
}