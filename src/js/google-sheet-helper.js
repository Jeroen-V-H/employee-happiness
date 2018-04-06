// helper to access google sheets
// instantiate like this:
// const options = { CLIENT_ID: YOUR_CLIENT_ID, API_KEY: YOUR_API_KEY },
// 		googleSheetHelper = window.createGoogleSheetHelper();
window.createGoogleSheetsHelper = function(options) {

	return (function(options) {

		// Client ID and API key from the Developer Console
		const CLIENT_ID = options.CLIENT_ID;
		const API_KEY = options.API_KEY;

		// Array of API discovery doc URLs for APIs used by the quickstart
		const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

		// Authorization scopes required by the API; multiple scopes can be
		// included, separated by spaces.
		const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

		const authorizeContainer = document.getElementById('gsh-authorize-container');
		const signoutContainer = document.getElementById('gsh-signout-container');
		const authorizeButton = document.getElementById('gsh-authorize-button');
		const signoutButton = document.getElementById('gsh-signout-button');

		// define element to show/hide
		const authorizeElm = authorizeContainer || authorizeButton;
		const signoutElm = signoutContainer || signoutButton;

		/**
		 *  On load, called to load the auth2 library and API client library.
		 */
		function handleClientLoad() {
			window.gapi.load('client:auth2', initClient);
		}

		/**
		 *  Initializes the API client library and sets up sign-in state
		 *  listeners.
		 */
		function initClient() {
			window.gapi.client.init({
				apiKey: API_KEY,
				clientId: CLIENT_ID,
				discoveryDocs: DISCOVERY_DOCS,
				scope: SCOPES
			}).then(function () {
				// Listen for sign-in state changes.
				window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

				// Handle the initial sign-in state.
				updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
				authorizeButton.onclick = handleAuthClick;
				signoutButton.onclick = handleSignoutClick;
			});
		}

		/**
		 *  Called when the signed in status changes, to update the UI
		 *  appropriately. After a sign-in, the API is called.
		 */
		function updateSigninStatus(isSignedIn) {
			if (isSignedIn) {
				console.log('signed in', authorizeElm, signoutElm);
				authorizeElm.style.display = 'none';
				signoutElm.style.display = 'block';
				
				document.body.dispatchEvent(new CustomEvent('googlesheethelperenabled'));
			} else {
				authorizeElm.style.display = 'block';
				signoutElm.style.display = 'none';
				document.body.dispatchEvent(new CustomEvent('googlesheethelperdisabled'));
			}
		}

		/**
		 *  Sign in the user upon button click.
		 */
		function handleAuthClick(event) {
			window.gapi.auth2.getAuthInstance().signIn();
		}


		/**
		 *  Sign out the user upon button click.
		 */
		function handleSignoutClick(event) {
			window.gapi.auth2.getAuthInstance().signOut();
		}

		/**
		* get this user's spreadsheets
		* @returns {undefined}
		*/
		const getSpreadsheets = function() {
			return window.gapi.client.sheets.spreadsheets;
		};
		

		/**
		* get sheet data
		* if you use range, specify range in a1 notation https://developers.google.com/sheets/api/guides/concepts#a1_notation
		* @param {object} options - Contains at least spreadsheetId, range
		* @returns {promise} api-calls promise, returning response's result-property
		*/
		const getData = function(options) {
			if (!options || !options.spreadsheetId || !options.range) {
				console.error('Make sure you call getData with at least this options object: {spreadsheetId, range}');
				return;
			}
			const prmise = window.gapi.client.sheets.spreadsheets.values.get(options)
			.then(function(response) {
				return response.result;
			}, function(response) {
				// error handling
				console.error('Error while getting data:', response.result.error.message);
			});

			return prmise;
		};


		function loadAPI() {
			const script = document.createElement('script');
			script.setAttribute('src', 'https://apis.google.com/js/api.js');
			script.addEventListener('load', handleClientLoad );
			document.querySelector('head').appendChild(script);
		}
		

		loadAPI();
		// be aware that since gapi is a global object, it is also available to all other scripts on the page.
		// We're only returning the getSpreadsheets functions for convenience
		const publicFunctions = {
			getData,
			getSpreadsheets
		};

		return publicFunctions;

	})(options);

};

