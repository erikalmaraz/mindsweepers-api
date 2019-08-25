'use strict'

const express = require('express')
const asyncify = require('express-asyncify')
const Joi = require('@hapi/joi')
const {product} = require('mindsweepers-db')

const routes = asyncify(express.Router())

const bodyCreate = Joi.object().keys({
  product: Joi.object.keys({
    name: Joi.string().required().label('Es necesario enviar un nombre'),
    detail: Joi.string().required().label('Es necesario enviar una descripción'),
    model_id: Joi.number().required().label('Es necesario enviar un modelo')
  }).required().label('Es necesario enviar product')
})
const bodyUpdate = Joi.object().keys({
  product: Joi.object().keys({
    name: Joi.string().allow(''),
    detail: Joi.string().allow(''),
    model_id: Joi.number(),
    product_id: Joi.number().required()
  }).required().label('Es necesario enviar product')
})
const bodySearch = Joi.object().keys({
  conditions: Joi.object().keys({
    name: Joi.string().allow(''),
    name_exact: Joi.string().allow(''),
    detail: Joi.string().allow(''),
    model_id: Joi.number(),
    model_name: Joi.string().allow(['']),
    model_name_exact: Joi.string().allow(['']),
    product_id: Joi.number().required()
  }).required().label('Es necesario enviar conditions')
})

routes.post('create', async(req, res, next) => {
  console.log('Request a product/create')
  try{
    const {body} = req
    await Joi.validate(body, bodyCreate)

    let result = await product.createProduct(body.product)
    body.product.product_id = result.id
    let returnObject = {
      error: false,
      total: 1,
      results: [body.product]
    }
    res.status(200).send(returnObject)
  }catch(err){
    return next(err)
  }
})

routes.put('update', async(req, res, next) => {
  console.log('Request a product/update')
  try{
    const {body} = req
    await Joi.validate(body, bodyUpdate)
    let dataUpdate = {}
    if(body.product.name !== undefined && body.product.name !== '') dataUpdate.name = body.product.name
    if(body.product.detail !== undefined && body.product.detail !== '') dataUpdate = body.product.detail
    if(body.product.model_id !== undefined && body.product.model_id !== '') dataUpdate = body.product.model_id

    await product.updateProduct(dataUpdate)
    return res.status(200).send({error: false, message: 'El producto se actualizó correctamente'})
  }catch(err){
    return next(err)
  }
})

routes.post('search', async(req, res, next) => {
  console.log('Request a model/search')
  try{
    const {body} = req
    await Joi.validate(body, bodySearch)
    let dataSearch = {}
    
    if(body.conditions.name !== undefined && body.conditions.name !== '') dataSearch.name = body.conditions.name
    if(body.conditions.name_exact !== undefined && body.conditions.name_exact !== '') dataSearch.name_exact = body.conditions.name_exact
    if(body.conditions.detail !== undefined && body.conditions.detail !== '') dataSearch.detail = body.conditions.detail
    if(body.conditions.model_name !== undefined && body.conditions.model_name !== '') dataSearch.model_name = body.conditions.model_name
    if(body.conditions.model_name_exact !== undefined && body.conditions.model_name_exact !== '') dataSearch.model_name_exact = body.conditions.model_name_exact
    if(body.conditions.model_id !== undefined && body.conditions.model_id !== '') dataSearch.model_id = body.conditions.model_id

    let result = await product.searchProduct(dataSearch)
    let returnObject = {
      error: false,
      total: result.length,
      results: result
    }
    res.status(200).send(returnObject)
  }catch(err){
    return next(err)
  }
})

module.exports = routes