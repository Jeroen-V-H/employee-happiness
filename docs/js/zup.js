// this file is specified in .gitignore to be left out of version control.
// it contains api keys etc for accessing the google sheet

// create global keys to access from files that are in version control
// this isn't a bulletproof solution, but since people visiting GitHub won't know where the page is hosted, so they can't easily get it. (and even if they would, we can change the api key)
window.secretStuff = {
	CLIENT_ID: '444000229229-btp90b7j6ondt0vl8h3j0nlt68gqdv3k.apps.googleusercontent.com',
	API_KEY: 'AIzaSyC_bWumlPwLKGFvt8UQJ_R7UV2UW-uEXZM'
};