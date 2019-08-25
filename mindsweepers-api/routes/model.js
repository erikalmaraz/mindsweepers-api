'use strict'

const express = require('express')
const asyncify = require('express-asyncify')
const Joi = require('@hapi/joi')
const {model} = require('mindsweepers-db')

const routes = asyncify(express.Router())

const bodyCreate = Joi.object().keys({
  model: Joi.object().keys({
    name: Joi.string().required().label('El nombre del modelo es requerido'),
    category: Joi.string().required().label('Es necesario enviar una categoría')
  }).required().label('Es necesario enviar el model')
})
const bodyUpdate = Joi.object().keys({
  model: Joi.object().keys({
    name: Joi.string().allow(['']),
    category: Joi.string().allow(['']),
    model_id: Joi.number().required().label('Es necesario enviar el id del modelo')
  }).required().label('Es necesario enviar el model')
})
const bodySearch = Joi.object().keys({
  conditions: Joi.object().keys({
    name: Joi.string().allow(['']),
    name_exact: Joi.string().allow(['']),
    category: Joi.string().allow(['']),
    category_exact: Joi.string().allow(['']),
    model_id: Joi.number()
  }).required().label('Es necesario enviar conditions')
})

routes.post('create', async(req, res, next) =>{
  console.log('Request a model/create')
  try{
    const {body} = req
    await Joi.validate(body, bodyCreate)
    let result = await model.createModel(body.model)
    body.model.model_id = result.id
    let returnObject = {
      error: false,
      total: 1,
      result: [body.model]
    }
    return res.status(200).send(returnObject)
  }catch(err){
    return next(err)
  }
})

routes.put('update', async(req, res, next) => {
  console.log('Request a model/update')
  try{
    const {body} = req
    await Joi.validate(body, bodyUpdate)
    let dataUpdate = {}
    if(body.model.name !== undefined && body.model.name !== '') dataUpdate.name = body.model.name
    if(body.model.category !== undefined && body.model.category !== '') dataUpdate = body.model.category

    await model.updateModel(dataUpdate)
    return res.status(200).send({error: false, message: 'El modelo se actualizó correctamente'})
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
    if(body.conditions.category !== undefined && body.conditions.category !== '') dataSearch.category = body.conditions.category
    if(body.conditions.category_exact !== undefined && body.conditions.category_exact !== '') dataSearch.category_exact = body.conditions.category_exact
    if(body.conditions.model_id !== undefined && body.conditions.model_id !== '') dataSearch.model_id = body.conditions.model_id

    let result = await model.searchModel(dataSearch)
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