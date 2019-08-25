'use strict'

const express = require('express')
const asyncify = require('express-asyncify')
const Joi = require('joi')
const { productClient } = require('mindsweepers-db')


const routes = asyncify(express.Router())

const bodyCreate = Joi.object().keys({
  purchase: Joi.string().required(),
  kilometers: Joi.string().required(),
  credit: Joi.number().required(),
  product_id: Joi.number().required(),
  client_id: Joi.number().required()
})

const bodySearch = Joi.object().keys({
  kilometers: Joi.string(),
  credit: Joi.number(),
  product_id: Joi.number(),
  client_id: Joi.string()
})

const bodyUpdate = Joi.object().keys({
  kilometers: Joi.string(),
  credit: Joi.string(),
  product_client_id: Joi.string().required()
})


routes.post('/create', async (req, res, next) => {
  console.log('Request a product-client/create')
  try {
    let conditions = req.body
    await Joi.validate(conditions, bodyCreate)
    let results = await productClient.createProductClient(conditions)
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
  console.log('Request a product-client/search')
  try {
    let conditions = req.body
    await Joi.validate(conditions, bodySearch)
    let results = await productClient.searchProductClient(conditions)
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

routes.put('/update', async (req, res, next) => {
  console.log('Request a product-client/update')
  try {
    let conditions = req.body
    await Joi.validate(conditions, bodyUpdate)
    let results = await productClient.updateProductClient(conditions)
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
