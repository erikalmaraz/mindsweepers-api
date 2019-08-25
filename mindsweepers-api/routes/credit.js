'use strict'

const debug = require('debug')('loyaltyCloud:api:user')
const express = require('express')
const asyncify = require('express-asyncify')
const Joi = require('joi')
const { Client } = require('mindsweepers-db')
const basicauth = require('basic-auth')

// Instancia del Router de express:
const routes = asyncify(express.Router())

const bodySignUp = Joi.object().keys({
  user: Joi.object().keys({
    name: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }).required()
})

routes.post('/signup', async (req, res, next) => {
  console.log('Request a client/signup')
  try {
    let { body } = req
    await Joi.validate(body, bodySignUp)

    let emailRes = await Client.searchClient({ email: body.client.email })
    if (emailRes.length > 0) {
      return res.status(500).send({ error: true, msg: 'Email registered' })
    }

    await User.createUser(body.user, req.merchant_id)


    let returnObject = {
      error: false,
      results: [{
        msg: 'Registered user successfully',
        token: token
      }]
    }

    return res.status(200).send(returnObject)
  } catch (error) {
    next(error)
  }
})

routes.post('/signin', async (req, res, next) => {
  console.log('Request a client/signin')
  try {
    let { body } = req
    
    let obj = {
      email: body.client.name,
      password: body.client.user.pass
    }
    
    let userRes = await Client.searchClient(obj)
    if (userRes.length === 0) {
      return res.status(500).send({ error: true, msg: 'Incorrect user or password' })
    }

    let returnObject = {
      error: false,
      results: [{
        login: true
      }]
    }

    return res.status(200).send(returnObject)
  } catch (error) {
    next(error)
  }
})

module.exports = routes
