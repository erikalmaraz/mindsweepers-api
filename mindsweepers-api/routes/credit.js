'use strict'

const express = require('express')
const asyncify = require('express-asyncify')
const BaseJoi = require('@hapi/joi')
const JoiDate = require('@hapi/joi-date')
const Joi = BaseJoi.extend(JoiDate)

const { credit } = require('mindsweepers-db')

const routes = asyncify(express.Router())

const bodyCreate = Joi.object().keys({
  date_ini: Joi.date().format('YYYY-MM-DD').utc(),
  date_end: Joi.date().format('YYYY-MM-DD').utc(),
  credit: Joi.number().required(),
  amount: Joi.number().min(1).required(),
  num_pagos: Joi.number().required(),
  status: Joi.boolean().required(),
  product_client: Joi.string().required()
})

const bodySearch = Joi.object().keys({
    created: Joi.array().items(Joi.date()).min(2).max(2),
    status: Joi.boolean().required(),
    amount: Joi.number().min(1).required(),
    num_pagos: Joi.number().min(1).required()   
})




routes.post('/create', async (req, res, next) => {
  console.log('Request a credit/create')
  try {
    let conditions = req.body
    await Joi.validate(conditions, bodyCreate)
    let results = await credit.createCredit(conditions)
    let returnObject = {
      error: false,
      total: results.lenght,
      results: results
    }
    return res.status(200).send(returnObject)
  } catch (error) {
    next(error)
  }
})

routes.post('/search', async (req, res, next) => {
  console.log('Request a credit/search')
  try {
    let conditions = req.body
    await Joi.validate(conditions, bodySearch)
    let results = await productClient.searchCredit(conditions)
    let returnObject = {
      error: false,
      total: results.lenght,
      results: results
    }
    return res.status(200).send(returnObject)
  } catch (error) {
    next(error)
  }
})


module.exports = routes
