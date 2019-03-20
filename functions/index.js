const { dialogflow, Permission, Suggestions, BasicCard } = require("actions-on-google");
const functions = require("firebase-functions");
const app = dialogflow({ debug: true });
const dateformat = require("dateformat");
const _ = require("lodash");

app.intent("roomBooking", (conv, data) => {
	let date = new Date(data.date);
	let start = new Date(data.timePeriod.startTime);
	let end = new Date(data.timePeriod.endTime);
	let names = "";
	data.fullName.forEach(v => {
		names += v["given-name"] + " " + v["last-name"] + ", ";
	});

	conv.data.everything = {
		date: date,
		start: start,
		end: end,
		names: data.fullName,
		room: data.roomNumber
	};

	conv.ask(
		`Ok, I have booked room ${data.roomNumber}, the ${dateformat(date, "dd/mmm")} from ${dateformat(start, "HH:MM")} to ${dateformat(
			end,
			"HH:MM"
		)} together with ${names} is this right?`
	);
});

app.intent("roomBooking - yes", (conv, data) => {
	conv.close("Cool beans");
});

app.intent("roomBooking - no", (conv, data) => {
	if (data.date != "") {
		conv.data.everything.date = data.date;
	}
	if (data.timePeriod != "") {
		let start = new Date(data.timePeriod.startTime);
		let end = new Date(data.timePeriod.endTime);
		conv.data.everything.start = start;
		conv.data.everything.end = end;
	}
	if (data.fullName.length > 0) {
		conv.data.everything.names = data.fullName;
	}
	if (data.edits != null && data.edits.length > 0) {
		data.edits.forEach(edit => {
			let names = edit["full-name"];
			if (!Array.isArray(names)) names = [names];
			if (edit.operator.toLowerCase() == "remove") {
                names.forEach(name => {
                    for (let i = conv.data.everything.names.length-1; i >= 0; i--) {
                        if(_.isEqual(name, conv.data.everything.names[i])){
                            conv.data.everything.names.splice(i, 1);
                        }
                    }
                })
			} else if (edit.operator.toLowerCase() == "add") {
				conv.data.everything.names.push(...names);
			}
		});
	}
	if (data.roomNumber != "") {
		conv.data.everything.room = data.roomNumber;
	}

	let names = "";
	conv.data.everything.names.forEach(v => {
		names += v["given-name"] + " " + v["last-name"] + ", ";
	});

	if (conv.data.everything.names.length > 0) {
		conv.ask(
			`Updated it to the following: ${conv.data.everything.room}, ${dateformat(conv.data.everything.date, "dd/mmm")} from ${dateformat(
				conv.data.everything.start,
				"HH:MM"
			)} to ${dateformat(conv.data.everything.end, "HH:MM")}. Together with ${names} is this right?`
		);
	} else {
		conv.ask(
			`Updated it to the following: ${conv.data.everything.room}, ${dateformat(conv.data.everything.date, "dd/mmm")} from ${dateformat(
				conv.data.everything.start,
				"HH:MM"
			)} to ${dateformat(conv.data.everything.end, "HH:MM")}. With just you, is this right?`
		);
	}
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
