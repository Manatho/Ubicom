const stringsim = require('string-similarity')
const axios = require('axios').create({
  baseURL: 'https://mitsdu.sdu.dk/booking/api'
})
const req = require('request')

const j = req.jar()
const request = req.defaults({ jar: j })

class BookingAPI {
  getCookieJar() {
    return j
  }

  getHTMLInputValue(html, inputName) {
    let regex = new RegExp(
      `<input[\\w\\s="]+name="${inputName}"[\\w\\s="]+value="(.*)"[\\w\\s="]+\\/?>`,
      'g'
    )
    console.log(regex)

    let res = regex.exec(html)

    return res
  }

  login() {
    return new Promise((resolve, reject) => {
      let username = process.env.BB_USERNAME
      let password = process.env.BB_PASSWORD

      //Request login page and retrieve login token
      let self = this
      request(
        'https://sso.sdu.dk/login?service=https://mitsdu.sdu.dk/booking/sso.aspx',
        function(error, response, body) {
          let loginToken = self.getHTMLInputValue(body, 'lt')
          console.log(`Login token: ${loginToken}`)

          request.post(
            {
              url:
                'https://sso.sdu.dk/login?service=https://mitsdu.sdu.dk/booking/sso.aspx',
              form: {
                auth: 'MAD',
                lt: loginToken,
                madusername: username,
                madpassword: password
              }
            },
            function(err, httpResponse, body) {
              setTimeout(() => {
                resolve()
                console.log(httpResponse.headers)
              }, 0)
            }
          )
        }
      )
    })
  }

  rooms() {
    return new Promise((resolve, reject) => {
      axios
        .get('/booking/rooms?{}', {
          headers: {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9,da-DK;q=0.8,da;q=0.7',
            'Content-Type': 'application/json; charset=utf-8',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        .then(res => resolve(res.data))
    })
  }

  roomExists(searchString) {
    searchString = searchString.toUpperCase()
    return new Promise((resolve, reject) => {
      this.rooms().then(res => {
        let matches = stringsim.findBestMatch(
          searchString,
          res.map(room => room.name)
        )
        if (matches.bestMatch.rating >= 0.33)
          resolve(res[matches.bestMatchIndex])
        reject(`No room found matching ${searchString}`)
      })
    })
  }

  // Actual booking POST URL https://mitsdu.sdu.dk/booking/Book.aspx
  bookRoom(roomCode) {
    let self = this
    request('https://mitsdu.sdu.dk/booking/Book.aspx', function(
      error,
      response,
      body
    ) {
      let __VIEWSTATE = self.getHTMLInputValue(body, '__VIEWSTATE')
      console.log(`__VIEWSTATE: ${__VIEWSTATE}`)


      // request.post(
      //   {
      //     url:
      //       'https://sso.sdu.dk/login?service=https://mitsdu.sdu.dk/booking/sso.aspx',
      //     form: {
      //       auth: 'MAD',
      //       lt: loginToken,
      //       madusername: username,
      //       madpassword: password
      //     }
      //   },
      //   function(err, httpResponse, body) {
      //     // console.log(err, httpResponse, body)
      //   }
      // )
    })

    let data = {
      ctl00$BodyContent$datepickerinput: '20-03-2019',
      ctl00$BodyContent$FromTime: '09:00',
      ctl00$BodyContent$ToTime: '10:00',
      // 'ctl00$BodyContent$ParticipantTB':
      booktype: 'name',
      // 'ctl00$BodyContent$SeatsHF'
      // 'ctl00$BodyContent$BuildingDDL'
      // 'ctl00$BodyContent$CommentTB'
      ctl00$BodyContent$RoomHF: 'room.u180',
      ctl00$BodyContent$MethodHF: 'typeahead',
      __VIEWSTATE:
        't0WVRJeFd0Of9oNpi/B87JRXNBwEbNd0vL/VYaz0+8aLWLV3gAYdltDYRkoV0vuZcIXeAso3EZ4DTDW0ZFWti/jhvogoV9ZZdFirIAwddot+pqhO03SfQEJ8BTVC0dtz3SkTsOUSY+1Y6/a/y7qc8xtEetSKas6phT8cqjoUTbRThSPIpozHsRgZObIXfa4Yaeje2yzT86JFfUBUpvYg+yR8yjUzAG1J/pM/OJ0vNYo+XzPmGKwewRnaZ0VUgSlZbWY6qJ963swCxPVEkvQuMTvpmTqs5l+8Hvg1xrwVc4NHtGLXlV/50+X5iteZ12SMoiSzBLVuSChtHBrl4sMGbaCTEf1CZeIEgw7Npq6R/QjIciH/btkYTmGkEx3wWyPt5aAxPpwsQl3n7Z9XqN+iVdsksDnDgSJCMlJDijpf9BWnvJj34WEmVQlMvSnRN50ECbvR7XqD/gYi4sg2SBp5ik47nml9asPWK9MDB9scqXuoyZrGwJTNS0gZBYg8EYviKbB0pAGKDifzhSTHaEN3fw1oOQFU2V1dC9Lq8Oa/QbdRpxGDHEQSwRSgFbfOKveKYOGkmq/5dhDrnyVEnzSZ/GDJS3n2OGUW191ISce9Bdcri36F7WBuKo7p8wxFcF9pNObIryWfcZlUXUVBBCPAfv+QXQ41iPqRFc4Yuv9qMasRwJ4GMc69S7MnC1x+yYIPkDqitLh1O6TzIqSoeOurTzU2NwUnySwOfWs1zX9I55KKmEpIAC28287nKVdWzCUWuBa8K+oY8J/aigaFYaVEmzSaWcAcn5BlkWxIH7BmSj/97j+UU6zAvrHSk1vxvjuT6TbR3C9bgrLPghYkUGpQ5uAybaIOz2pTmwGG63kSScx1OY4m6y1AoNJzzXUrDc1RyN5g90E1+qQZGgT8bYU9LJcS5SCtKQxVNOFLUPEdZjMn1CPSSSG7+sdAXdQdVObXI1+/eJ4FLhnO7hVPDeKVgu12tb1SJsleOlNVmxm604F8Q2R2nbCImHH37zETrqZvRXyaTqtI4gA7sRRYLbPRmZNa3thOzGH6/C+tfOdHjNpXDYwoAWUiOCHQENj4vT0ZTET6l28t055oNHDjvQScanbWxF/2n9IBjlTd66B9SXUgwWfigPFo/e99UY/q3epuut5mV4Fwc8J7fgtgw9yCjWnFQdahyRr3ZXjU6lfBMkPpY9loxWRx/w/XD9Rcyk3/l2Mhiyp3CYO6HdW4Y/WtaxZ2EOnucVwOCV2z5FZ39nFrBnG26CHJwY3HYBa0x0zoSOuV0ITXfESEYmb5EXhx0Q==',
      __VIEWSTATEGENERATOR: '1DB1457F',
      __EVENTVALIDATION:
        'jqcrwWR9UU9WilqFd+Xpegqv2FyAvm1YUAoziTv7cag/yoam1p3c/InNLwHv0EL4GBjD/ZEXFSbxRdJLMS7uT0DFOrYLNRbJF1FC+UrOCUENCO7Fuxryu3rspyt3GdZWdMRiW8Na3LyEZM+czy/tIFdpUJTxNk9rbg0/495fN76Zwe5I4xxA/Y612fzsY9TDBpUP/YvrW7bm698e5kUn6CNsAgrmk8TN/2+0YgBAFEJteDR6Xenor8SGx8j4Tydqtl109F1mSJzmqNwIUM9iyhdSgZdN54vLp69XLfHh3JFy0TcaW583orjJHwJM91lOsZDu1o0NCYeVRBIoN0a01GgsKujCBvXTKkjsG+t8UpqWnyWudGY/+jFRQpa8xkPuPtrPgN/4pjNDf10a0E0fE0p7ZQW2lq0MT9J2UZqH0OT2WWkF0IHhefwCgUAu+5EtUgI4ZzJIdl2Q3Xqa6kwQThdnURZI2lz6gxCIcvzoeK0QRGiVesSXbl9+7y4u1puyrKsaIlaKqrFNelcZyj7YAhg/01vyuHD8KH9SH1dyEE4EY6lTFnEN8J528mjim8q6UIJBdvKXKbqHMiSla3Ak29BOlEdVMsujT89Pmk8kpsXKXXKfCsL/dbXEqNwmkpOI8y7ITgcRRCfpR38e5WpuuIL++nQfWgrymiqdp8CNBzm3CvhnKJHjNOeog48GOndqMNI7E3KHP2NPzitjeaOsWo9uEEmiVzsKOwkuNyLfCSC2hwAo7tO6mrT3WSHY3781V5nwcCrLh0XKTWsEeYbwoA==',
      __ASYNCPOST: true
      // 'ctl00$BodyContent$BookButton'	Book selected room
    }
  }
}

module.exports = BookingAPI
