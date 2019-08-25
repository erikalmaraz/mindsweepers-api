'use strict'

const config = require('../config')
const promise = require('bluebird')
// const options = {
//   promiseLib: promise
// }
const options = {
  promiseLib: promise,
  // global event notification;
  error: (error, e) => {
    if (e.cn) {
      // A connection-related error;
      // Connections are reported back with the password hashed,
      // for safe errors logging, without exposing passwords.
      console.log('CN2:', e.cn);
      console.log('EVENT:', error.message || error);
    }
  }
}

let postgres = null
const pgp = require('pg-promise')(options)
const url = `postgres://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.database}`

module.exports = function setupDatabase () {
  if (!postgres) {
    postgres = pgp(url)
  }
  return postgres
}
