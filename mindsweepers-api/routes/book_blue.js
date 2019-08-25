'use strict'

const express = require('express')
const asyncify = require('express-asyncify')
const baseJoi = require('@hapi/joi')
const dateJoi = require('@hapi/joi-date')
const Joi = baseJoi.extend(dateJoi)
const {bookBlue} = require('mindsweepers-db')

const routes = asyncify(express.Router())

const bodyCreate = Joi.object().keys({
  book_blue: Joi.object().keys({
    year: Joi.string().required().label('El año de la moto es requerido'),
    cylindrical: Joi.string().required().label('El cilindraje es obligatorio'),
    kilometers: Joi.array().min(2).required().label('El rango de kilometrajes es obligatorio'),
    product_id: Joi.number().required()
  }).required().label('Es necesario enviar la cabecera')
})

const bodyUpdate = Joi.object().keys({
  book_blue: Joi.object().keys({
    year: Joi.string(),
    cylindrical: Joi.string(),
    kilometers: Joi.array().min(2),
    product_id: Joi.number(),
    book_blue_id: Joi.number().required().label('Es necesario enviar el id del libro azul')
  }).required().label('Es necesario enviar la cabecera')
})

routes.post('create', async(req, res, next) =>{
  console.log('Request a book_blue/create')
  try{
    const {body} = req
    await Joi.validate(body, bodyCreate)
    let result = await bookBlue.createBookBlue(body.book_blue)
    body.book_blue.book_blue_id = result.id
    let returnObject = {
      error: false,
      total: 1,
      result: [body.book_blue]
    }
    return res.status(200).send(returnObject)
  }catch(err){
    return next(err)
  }
})

routes.put('update', async(req, res, next) => {
  console.log('Request a book_blue/update')
  try{
    const {body} = req
    await Joi.validate(body, bodyUpdate)
    let dataUpdate = {}
    
    if(body.book_blue.year !== undefined && body.book_blue.year !== '') dataUpdate.year = body.book_blue.year
    
    dataUpdate.cylindrical = body.book_blue.cylindrical
    dataUpdate.kilometers = body.book_blue.kilometers
    dataUpdate.product_id = body.book_blue.product_id
    dataUpdate.book_blue_id = body.book_blue.book_blue_id 

    await bookBlue.updateBookBlue(dataUpdate)

    
    return res.status(200).send({error: false, message: 'El libro azul se actualizó correctamente'})
  }catch(err){
    return next(err)
  }
})



module.exports = routes