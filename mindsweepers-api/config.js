const debug = require('debug')('loyaltyCloud:db')

module.exports = {
  db: {
    database: process.env.DB_NAME || 'italika',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
  }
}
