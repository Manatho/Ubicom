const { dialogflow, Permission, Suggestions, BasicCard } = require("actions-on-google");
const functions = require("firebase-functions");
const app = dialogflow({ debug: true });
const dateformat = require("dateformat");

app.intent("Book", (conv, { Room_Number }) => {
    conv.data.room = Room_Number;
    if(conv.data.date != null){
        conv.ask(response + "Who would you like to book with?")
    } else {
        conv.ask("you said " + Room_Number + ". What period would you like to book?");
    }
});

app.intent("BookTime", (conv, data) => {
    conv.data.date = data.date;
    conv.data.timeperiod = data.timeperiod;
    let date =  new Date(data.date);
    let start = new Date(data['time-period'].startTime)
    let end = new Date(data['time-period'].endTime)
    
    let response = `you said ${dateformat(date, "dd/mm")} from ${dateformat(start, "HH:MM")} to ${dateformat(end, "HH:MM")}. `;
    if(conv.data.room != null){
        conv.ask(response + "Who would you like to book with?")
    } else {
        conv.ask(response + "Which room would you like to book?")
    }
});

app.intent("Attendees", (conv, data) => {
    conv.data.attendees = data.fullName
    let response = "You said "
    data.fullName.forEach((v) => {response += v["given-name"] + " " + v["last-name"] + ", "});

    if(conv.data.room == null) {
        conv.ask(response + "Which room would you like to book?")
    } else {
        conv.ask(response + "Which room would you like to book?")
    }
})

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
