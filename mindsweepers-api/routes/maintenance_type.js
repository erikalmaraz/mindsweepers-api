'use strict'

const express = require('express')
const asyncify = require('express-asyncify')
const Joi = require('@hapi/joi')
const { maintenanceType } = require('mindsweepers-db')

const routes = asyncify(express.Router())

const bodyCreate = Joi.object().keys({
  maintenance_type: Joi.object().keys({
    name: Joi.string().required().label('El nombre del modelo es requerido'),
    description: Joi.string().required().label('Es necesario enviar una descripción')
  }).required().label('Es necesario enviar el tipo de mantenimiento')
})
const bodyUpdate = Joi.object().keys({
  maintenance_type: Joi.object().keys({
    name: Joi.string().allow(['']),
    description: Joi.string().allow(['']),
    maintenance_type_id: Joi.number().required().label('Es necesario enviar el id del tipo de mantenimiento')
  }).required().label('Es necesario enviar el tipo de mantenimiento')
})
const bodySearch = Joi.object().keys({
  conditions: Joi.object().keys({
    name: Joi.string().allow(['']),
    name_exact: Joi.string().allow(['']),
    description: Joi.string().allow(['']),
    maintenance_type_id: Joi.number()
  }).required().label('Es necesario enviar conditions')
})

routes.post('create', async(req, res, next) =>{
  console.log('Request a maintenance_type/create')
  try{
    const {body} = req
    await Joi.validate(body, bodyCreate)
    let result = await maintenanceType.createMaintenanceType(body.maintenance_type)
    body.maintenance_type.maintenance_type_id = result.id
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
  console.log('Request a maintenance_type/update')
  try{
    const {body} = req
    await Joi.validate(body, bodyUpdate)
    let dataUpdate = {}
    if(body.maintenance_type.name !== undefined && body.maintenance_type.name !== '') dataUpdate.name = body.maintenance_type.name
    if(body.maintenance_type.description !== undefined && body.maintenance_type.description !== '') dataUpdate = body.maintenance_type.description
    
    await maintenanceType.updateMaintenanceType(dataUpdate)
    return res.status(200).send({error: false, message: 'El tipo de mantenimiento se actualizó correctamente'})
  }catch(err){
    return next(err)
  }
})

routes.post('search', async(req, res, next) => {
  console.log('Request a maintenance_type/search')
  try{
    const {body} = req
    await Joi.validate(body, bodySearch)
    let dataSearch = {}
    
    if(body.conditions.name !== undefined && body.conditions.name !== '') dataSearch.name = body.conditions.name
    if(body.conditions.name_exact !== undefined && body.conditions.name_exact !== '') dataSearch.name_exact = body.conditions.name_exact
    if(body.conditions.description !== undefined && body.conditions.description !== '') dataSearch.description = body.conditions.description
    if(body.conditions.maintenance_type_id !== undefined && body.conditions.maintenance_type_id !== '') dataSearch.maintenance_type_id = body.conditions.maintenance_type_id

    let result = await maintenanceType.searchMaintenanceType(dataSearch)
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