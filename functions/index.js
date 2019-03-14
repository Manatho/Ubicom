const { dialogflow, Permission, Suggestions, BasicCard } = require("actions-on-google");
const functions = require("firebase-functions");
const app = dialogflow({ debug: true });

app.intent("Book", (conv, { Room_Number }) => {
		conv.ask(
            'you said ' + Room_Number +'. What period would you like to book?'
		);
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);