# Employee happiness

Shows employee data on happiness and business in a graph. Source for the data is a Google sheet, which is filled by a Google form.

## Local development

In the src folder, run ``node webserver.js``; You can then view the graph at http://localhost:8000.

## Troubleshooting

### Not a valid origin
When moving the project from my localhost to my site, I got the message
_Not a valid origin for the client: http://yourdomain.com has not been whitelisted for client ID 12345678-abcdefgh123jkl.apps.googleusercontent.com. Please go to https://console.developers.google.com/ and whitelist this origin for your project's client ID._

To solve this:
- go to https://console.developers.google.com/
- at top left, after "GoogleAPIs", select your project from dropdown
- at left menu bar, click key-icon (login settings)
- Underneath OAuth 2.0-client-ID's, click on your project
- under restrictions > authorized javascript sources add your domain.
