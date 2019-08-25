const debug = require('debug')('loyaltyCloud:db')

module.exports = {
  db: {
    database: process.env.DB_NAME || '',
    username: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
  }
}
