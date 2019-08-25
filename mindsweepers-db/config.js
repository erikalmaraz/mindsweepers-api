'use strict'

module.exports = {
  db: {
    database: process.env.DB_NAME || 'italika',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'mysql',
    host: process.env.DB_HOST || 'localhost'
  }
}