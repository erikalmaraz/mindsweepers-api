const debug = require('debug')('loyaltyCloud-api:*')
const chalk = require('chalk')
const http = require('http')
const express = require('express')
const asyncify = require('express-asyncify')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const serializeError = require('serialize-error')

const config = require('./config')


const {
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
} = require('./routes')

const port = process.env.PORT || 3000
const app = asyncify(express())
const server = http.createServer(app)

// Seteo de middlewares:
// Evitar problemas de CORS:
app.use(function(req, res, next) {
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
   // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')
   // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
   // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true)
   // Pass to next layer of middleware
  next()
 })



app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: '2553433' }))
app.use(helmet())

// Handlers para las rutas según los modelos:
app.use('/model', model)
app.use('/product', product)
app.use('/client', client)
app.use('/product-client', productClient)
app.use('/credit', credit)
app.use('/maintenance', maintenance)
app.use('/maintenance-type', maintenanceType)
app.use('/book-blue', bookBlue)
app.use('/feel', feel)

/*
app.use('/book-blue', bookBlue)
app.use('/credit-configuration', creditConfiguration)
app.use('/promotion', promotions)
*/


// Aumentamos el tiempo de espera a 3minutos
server.timeout = 180000

// Express Error Handler

app.use((err, req, res, next) => {
  console.log(err)
  if (err.error) {
    return res.status(500).send({
      error: true,
      log_id: err.log_id,
      name: `${err.error.details ? err.error.details[0].name : err.error.name ? err.error.name : ''}`,
      description: `${err.error.details ? err.error.details[0].message : err.error.message ? err.error.message : ''}`,
      stack: serializeError({ name: err.error.name, details: err.error.details }),
      results: null,
    })
  }

  return res.status(500).send({
    error: true,
    log_id: err.log_id,
    description: `${err.error ? err.error.message : err.message}`,
    results: null,
  })
})

function handleFatalError(err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

if (!module.parent) {
  process.on('uncaughtException', handleFatalError)
  process.on('unhandledRejection', handleFatalError)

  server.listen(port, () => {
    console.log(`${chalk.green('[loyaltyCloud-api]')} server listening on port ${port}`)
  })
}

module.exports = server