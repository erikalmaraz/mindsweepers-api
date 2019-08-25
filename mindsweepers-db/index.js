'use strict'

const bookBlueClass = require('./class/book_blue')
const clientClass = require('./class/client')
const creditConfigurationClass = require('./class/credit_configuration')
const creditClass = require('./class/credit')
const maintenanceClass = require('./class/maintenance')
const maintenanceTypeClass = require('./class/maintenanceType')
const modelClass = require('./class/model')
const productClientClass = require('./class/product_client')
const productClass = require('./class/product')
const promotionsClass = require('./class/promotions')


const bookBlue = new bookBlueClass()
const client   = new clientClass()
const creditConfiguration   = new creditConfigurationClass()
const credit = new creditClass()
const maintenance   = new maintenanceClass()
const maintenanceType   = new maintenanceTypeClass()
const model   = new modelClass()
const productClient   = new productClientClass()
const product   = new productClass()
const promotions   = new promotionsClass()

module.exports = {
    bookBlue,
    client,
    creditConfiguration,
    credit,
    maintenance,
    maintenanceType,
    model,
    productClient,
    product,
    promotions
}