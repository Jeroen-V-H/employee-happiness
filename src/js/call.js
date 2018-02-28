let sheetHelper;




/**
* read data from the sheet
* @returns {undefined}
*/
const readData = function() {
	const options = {
		spreadsheetId: '1K4YbGsCSSIJhB0nYArs0XouoOqT1xGyM2KWOdny-tLs',
		range: "'Team happiness responses'!A2:G",
	};

	// get data in promise
	sheetHelper.getData(options)
	.then((result) => {
		console.log('response in call', result);
	})

	console.log(sheetHelper.getSpreadsheets());
};


/**
* get data from google sheet
* @returns {undefined}
*/
const getSheetHelper = function() {
	// use api key etc from window.secretStuff (which is not in version control)
	const sheetOptions = {
		CLIENT_ID: window.secretStuff.CLIENT_ID,
		API_KEY: window.secretStuff.API_KEY
	};

	sheetHelper = window.createGoogleSheetsHelper(sheetOptions);
};


/**
* initialize stuff for handling google sheet
* @returns {undefined}
*/
const initGoogleSheet = function() {
	document.body.addEventListener('googlesheethelperenabled', readData);
	getSheetHelper();
};

initGoogleSheet();







			// columns:
			// timestamp
			// email
			// name
			// happiness
			// business
			// remark
			// week nr