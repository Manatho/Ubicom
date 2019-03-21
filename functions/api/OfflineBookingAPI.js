const stringsim = require("string-similarity");
const fs = require("fs");
const path = require("path");

class BookingAPI {
  constructor() {
    this.dbFile = path.join(__dirname, "./rooms.db");
    this.rooms = {
      U180: {
        bookings: [
          {
            start: "2019-03-30T12:00:00.308Z",
            end: "2019-03-30T12:00:00.308Z",
            names: ["Mathies Hovedskou", "Daniel Holst", "Jonas Pedersen"]
          }
        ]
      },
      U181: {
        bookings: []
      },
      U182: {
        bookings: []
      },
      U183: {
        bookings: []
      },
      U184: {
        bookings: []
      },
      U185: {
        bookings: []
      },
      "Room Full of Fears": {
        bookings: []
      }
    };

    if (!fs.existsSync(this.dbFile)) {
      this._saveDatabase();
      this.bookRoom("Room Full of Fears", new Date(), new Date(), "Reaper")
        .then(() => console.log("succes"))
        .catch(err => console.log(err));
    } else {
      this._loadDatabase();
    }
  }

  _loadDatabase() {
    this.rooms = JSON.parse(fs.readFileSync(this.dbFile));
  }

  _saveDatabase() {
    fs.writeFileSync(this.dbFile, JSON.stringify(this.rooms, null, 2));
  }

  rooms() {
    return this.rooms;
  }

  _roomExists(roomCode) {
    return this.rooms[roomCode] != undefined;
  }

  _roomIsBooked(roomCode, start, end) {
    if (this._roomExists(roomCode)) {
      let booked = false;
      let room = this.rooms[roomCode];
      room.bookings.forEach(booking => {
        if (
          !(
            (start < booking.start && end < booking.start) ||
            (start > booking.end && end > booking.end)
          )
        ) {
          return true;
        }
      });
    }
    return false;
  }

  bookRoom(roomCode, start, end, ...names) {
    return new Promise((resolve, reject) => {
      if (!this._roomExists(roomCode)) {
        return reject(`Room "${roomCode}" does not exist!`);
      }
      if (this._roomIsBooked(roomCode, start, end)) {
        return reject(
          `Room "${roomCode}" is booked within the desired timeframe`
        );
      }

      this.rooms[roomCode].bookings.push({ start, end, names:names });
      this._saveDatabase();
      return resolve();
    });
  }
}

module.exports = BookingAPI;
