'use-strict'

const model = require('./model')
const product = require('./product')
const bookBlue = require('./book_blue')
const creditConfiguration = require('./credit_configuration')
const promotions = require('./promotions')
const client = require('./client')
const productClient = require('./product_client')
const credit = require('./credit')
const maintenance = require('./maintenance')
const maintenanceType = require('./maintenance_type')
const feel= require('./feel')

module.exports = {
  model,
  product,
  bookBlue,
  creditConfiguration,
  promotions,
  client,
  productClient,
  credit,
  maintenance,
  maintenanceType,
  feel
}
