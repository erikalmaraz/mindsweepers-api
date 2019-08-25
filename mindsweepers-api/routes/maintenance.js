'use strict'

const debug = require('debug')('loyaltyCloud:api:user')
const express = require('express')
const asyncify = require('express-asyncify')
const Joi = require('@hapi/joi')
const { Client } = require('mindsweepers-db')

// Instancia del Router de express:
const routes = asyncify(express.Router())


const bodyCreate = Joi.object().keys({
  type: Joi.string().required(),
  date: Joi.date().format('YYYY-MM-DD').utc(),
  status: Joi.boolean().required(),
  kilometers: Joi.number().required(),
  comments: Joi.string().required(),
  maintenance_type_id: Joi.string().required(),
  product_client_id: Joi.string().required(),
  
})

const bodySearch = Joi.object().keys({
  type: Joi.string(),
  date: Joi.date().format('YYYY-MM-DD').utc(),
  status: Joi.boolean(),
  kilometers: Joi.number(),
  maintenance_type_id: Joi.string(),
  product_client_id: Joi.string()
})

const bodyUpdate = Joi.object().keys({
  person_id: Joi.string().min(18).max(18).token()
    .required(),
  name: Joi.string().max(100),
  middlename: Joi.string().allow('').max(100),
  lastname: Joi.string().max(100),
  email: Joi.string().email(),
  birthdate: Joi.date(),
  gender: Joi.string(),
  status: Joi.string(),
  phones: Joi.array(),
  init_date: Joi.date(),
  metadata: Joi.any(),
  user_id: Joi.string().min(18).max(18).token(),
  profession: Joi.string(),
})

const bodyDelete = Joi.object().keys({
  person_id: Joi.string().min(18).max(18).token()
    .required(),
})


router.post('/search', async (req, res, next) => {
  console.log('POST person/search')
  
  try {
    let { conditions } = req.body
    const statuses = await PersonStatus.getAll()

    if (!conditions) return res.status(400).send({ error: true, errorMsg: 'Request body malformed' })
    await Joi.validate(conditions, bodySearch)
    if (!conditions) conditions = {}

    if (conditions.status) conditions.status = await PersonStatus.getId(conditions.status)
    if (conditions.exclude) {
      conditions.exclude = conditions.exclude.map(function (elem) {
        let aux = statuses.find(stat => {
          if (stat.name === elem) {
            return stat.id
          }
        })
        return aux.id
      })
    }

    if (conditions.user_id) {
      const user = await User.findByUserId(conditions.user_id, req.merchant_id)
      if (!user) return res.status(404).send({ error: true, errorMsg: 'User not found.' })
      conditions.user_id = user.id
    }

    const merchant_Id = conditions.merchants ? null : req.merchant_id

    let results = await Person.findAll(
      merchant_Id,
      Object.keys(conditions).length !== 0 ? conditions : null,
      req.body.page_number ? req.body.page_number : null,
      req.body.number_entries ? req.body.number_entries : null,
    )

    /*
      Emulo el limit debido al problema que genera una subquery solo para la tabla persona
      y los filtros que incolucran a los joins, dejan de funcionar.
    */
    if (req.body.page_number && req.body.number_entries) {
      results = results.slice(0, req.body.number_entries)
    }

    const returnObject = {
      error: false,
      total: await Person.howMany(merchant_Id, conditions),
      results,
    }

    if (req.body.page_number && req.body.number_entries) {
      returnObject.page = req.body.page_number
      returnObject.numberOfEntries = results.length
    }

    return res.status(200).send(returnObject)
  } catch (error) {
    debug(error)
    return next(error)
  }
})

router.post('/create', async (req, res, next) => {
  console.log('POST person/create')
  try {
    const { person } = req.body
    const mId = req.merchant_id

    if (!person) return res.status(400).send({ error: true, errorMsg: 'Request body malformed' })
    await Joi.validate(person, bodyCreate)

    const existGateway = await Gateway.findByCode('feenicia')
    const existGatewayMerchant = await GatewayMerchant.findByMerchantGateway(req.merchant_id, existGateway.id)

    const existGatewayOP = await Gateway.findByCode('openpay')
    const existGatewayMerchantOP = await GatewayMerchant.findByMerchantGateway(req.merchant_id, existGatewayOP.id)

    // Validamos que no exista el correo:
    let exitsPerson = await Person.findAll(req.merchant_id, { exactemail: person.email })

    if (exitsPerson.length !== 0) return res.status(400).send({ error: true, errorMsg: 'The email already exits.' })

    const newRecord = {
      merchant_id: mId,
      name: person.name,
      middlename: person.middlename ? person.middlename : null,
      lastname: person.lastname,
      email: person.email,
      birthdate: person.birthdate,
      channel_id: req.channel_id,
      person_status_id: await PersonStatus.getId('lead'),
      metadata: person.metadata ? person.metadata : null,
      profession: person.profession ? person.profession : null
    }

    // Buscamos el usuario de la agencia/facer:
    if (person.user_id) {
      let user = await User.findByUserId(person.user_id)
      if (!user) return res.status(404).send({ error: true, errorMsg: 'User not found.' })
      newRecord.user_id = user.id
    }

    // Client sequence:
    if (person.clientSequence) newRecord.client_sequence = person.clientSequence

    // Birthdate:
    if (person.birthdate) newRecord.birthdate = person.birthdate

    // Gender:
    if (person.gender) newRecord.gender = person.gender

    if (person.data_1) newRecord.data_1 = person.data_1
    if (person.data_2) newRecord.data_2 = person.data_2
    if (person.data_3) newRecord.data_3 = person.data_3
    if (person.reference) newRecord.reference = person.reference

    // Si mandan estatus:
    if (person.status) {
      let statusId = await PersonStatus.getId(person.status)

      if (!statusId) return next(new Error('Status nor found'))

      newRecord.person_status_id = statusId
    }

    // Si existe configurado el gateway feenicia para el merchant, entonces hay que pedir el token de autorización para esta persona:
    if (existGatewayMerchant.length !== 0 && existGatewayMerchant[0].gateway.name === 'feenicia') {
      const resultsFeenicia = await signUp(existGatewayMerchant[0].configuration.tokenAplic, newRecord.email)

      if (resultsFeenicia.code === '00') {
        newRecord.data_3 = resultsFeenicia.token
      } else {
        return next(new Error(`Feenicia. ${resultsFeenicia.message}`))
      }
    }

    // Si existe configurado el gateway OpenPay para el merchant, entonces hay que pedir el token de autorización para esta persona:
    if (existGatewayMerchantOP.length !== 0 && existGatewayMerchantOP[0].gateway.name === 'OpenPay') {

      let customerRequest = {
        'name': newRecord.name,
        'last_name': newRecord.lastname,
        'email': newRecord.email,
        'requires_account': true
      }

      try {
        const customerRes = await createCustomerOP(existGatewayMerchantOP[0].configuration.merchantId, existGatewayMerchantOP[0].configuration.privateKey, customerRequest)
        newRecord.data_3 = customerRes.id
      } catch (error) {
        return next(new Error(`CP OpenPay. ${error.description}`))
      }
    }

    // Creamos a la persona:
    let result = await Person.create(mId, newRecord)
    let personId = await Person.getId(result.person_id)


    // Actualizar el person ID en openpay para auditorias
    if (existGatewayMerchantOP.length !== 0 && existGatewayMerchantOP[0].gateway.name === 'OpenPay') {
      let customerRequest = {
        'name': newRecord.name,
        'last_name': newRecord.lastname,
        'email': newRecord.email,
        'external_id': result.person_id
      }
      try {
        await updateCustomerOP(existGatewayMerchantOP[0].configuration.merchantId, existGatewayMerchantOP[0].configuration.privateKey, customerRequest, newRecord.data_3)  
      } catch (error) {
        console.log(`Error Actualizando person - OpenPay. ${error}`)
      }
      
    }

    // Hay teléfonos que agregar?
    if (person.phones && person.phones.length !== 0) { // Toca agregarlos
      let resultIterator = null

      // Para cada teléfono incrustamos:
      for (let iterator of person.phones) {
        // A quién pertenece:
        iterator.person_id = personId
        // El ciente Nebula al que pertenece:
        iterator.merchant_id = req.merchant_id
        // Cableado, por el momento, México:
        iterator.country_id = 1
        // Obtenemos el Id de la BD para el tipo de teléfono indicado:
        iterator.phone_type_id = await PhoneType.getId(iterator.type)
        // Creamos el teléfoni:
        resultIterator = await Phone.create(iterator)
      }
    }

    // Registramos el status para esta nueva persona:
    let perHistoryObj = { person_id: personId, person_status_id: newRecord.person_status_id }
    let newStatusHistory = await PersonHistory.create(perHistoryObj)

    // Consultamos a la persona recien creada, para devolverla con los teléfonos creados:
    const createdPerson = await Person.findAll(req.merchant_Id, { person_id: result.person_id })

    // Logeo:
    if (req.user_id && req.channel_id === 1) {
      let userToLog = await User.findById(req.user_id)
      if (userToLog) {
        await log.register({
          username: userToLog.username,
          fullname: userToLog.full_name,
          email: userToLog.email,
          action: 'creacion',
          message: `El usuario ha creado la persona ${result.person_id}`,
          merchant_id: req.merchant_id
        })
      }
    }

    return res.status(200).send({ error: false, total: createdPerson.length, results: createdPerson })
  } catch (error) {
    next(error)
  }
})

router.put('/update', async (req, res, next) => {
  console.log('PUT person/update')
  try {
    const { person } = req.body
    console.log('Person: ', person)
    if (!person) return res.status(400).send({ error: true, errorMsg: 'Request body malformed' })
    await Joi.validate(person, bodyUpdate)

    const personId = await Person.getId(person.person_id)
    const mId = req.merchant_id
    let perHistoryObj = null

    // Validamos que no exista el correo:
    const exitsPerson = await Person.getId(person.person_id)

    if (!exitsPerson) return res.status(500).send({ error: true, errorMsg: 'Person not found.' })

    // Validar que no exista el email previamente para otra persona:
    if (person.email) {
      // Si existe el correo para el merchant y es de una persona diferente, entonces no se puede modificar el correo:
      const emailCanBeUpdated = await Person.validateEmailUpdate(
        mId,
        person.email,
        person.person_id,
      )
      if (!emailCanBeUpdated) return res.status(500).send({ error: true, errorStack: 'Email already in use.' })
    }

    // Verificamos si es el robot el que hace la petición:
    const { robot } = req.body
    // Si es el robot y piden cambiar el estatus, lo dejamos:
    if (robot && person.status) {
      const statusId = await PersonStatus.getId(person.status)

      if (!statusId) return res.status(404).send({ error: true, errorMsg: 'Person status not found.' })

      person.person_status_id = statusId

      delete person.status

      // Registro del cambio de estatus para la persona:
      perHistoryObj = { person_id: personId, person_status_id: person.person_status_id }
    }

    if (person.user_id) {
      const user = await User.findByUserId(person.user_id, req.merchant_id)
      if (!user) return res.status(404).send({ error: true, errorMsg: 'User not found.' })
      person.user_id = user.id
    }

    // Mandamos a actualizar el registro:
    const result = await Person.update(person)

    // Hay que actualizar teléfonos?:
    if (person.phones && person.phones.length !== 0) {
      let resultIterator = null
      // Para cada teléfono incrustamos:
      for (const iterator of person.phones) {
        if (iterator.type) { // Si piden cambiar el tipo del teléfono, entonces lo buscamos en la BD:
          iterator.phone_type_id = await PhoneType.getId(iterator.type)
        }
        if (iterator.phone_id) { // Lo actualizamos:
          // Actualizamos el registro del teléfono:
          resultIterator = await Phone.update(iterator)
        } else {
          // A quién pertenece:
          iterator.person_id = personId
          // El ciente Nebula al que pertenece:
          iterator.merchant_id = req.merchant_id
          // Cableado, por el momento, México:
          iterator.country_id = 1
          // Obtenemos el Id de la BD para el tipo de teléfono indicado:
          iterator.phone_type_id = await PhoneType.getId(iterator.type)
          // Obligamos a que el número sea un string:
          iterator.number = iterator.number.toString()
          // Creamos el teléfoni:
          resultIterator = await Phone.create(iterator)
        }
      }
    }

    // Si el robot solicitó un cambio de estatus, entonces lo registramos en el histórico:
    if (perHistoryObj) {
      await PersonHistory.create(perHistoryObj)
    }

    const updatedPerson = await Person.findAll(req.merchant_Id, { person_id: result[0].person_id })

    // Logeo:
    if (req.user_id && req.channel_id === 1) {
      const userToLog = await User.findById(req.user_id)
      if (userToLog) {
        await log.register({
          username: userToLog.username,
          fullname: userToLog.full_name,
          email: userToLog.email,
          action: 'actualizacion',
          message: `El usuario ha actualizado información de la persona ${result[0].person_id}`,
          merchant_id: req.merchant_id,
        })
      }
    }

    return res.status(200).send({
      error: false,
      total: updatedPerson.length,
      results: updatedPerson,
    })
  } catch (error) {
    return next(error)
  }
})

router.delete('/delete', async (req, res, next) => {
  console.log('DELETE person/delete')
  try {
    const { person } = req.body

    if (!person) return res.status(400).send({ error: true, errorMsg: 'Request body malformed' })
    await Joi.validate(person, bodyDelete)

    let result = await Person.deletePerson(person.person_id)

    if (!result) return res.status(404).send({ error: true, errorMsg: 'Person not Found.' })

    // Logeo:
    if (req.user_id && req.channel_id === 1) {
      let userToLog = await User.findById(req.user_id)
      if (userToLog) {
        await log.register({
          username: userToLog.username,
          fullname: userToLog.full_name,
          email: userToLog.email,
          action: 'eliminacion',
          message: `El usuario ha eliminado a la persona ${person.person_id}`,
          merchant_id: req.merchant_id
        })
      }
    }

    return res.status(200).send({ error: false, results: true, Msg: 'Person deleted.' })
  } catch (error) {
    next(error)
  }
})

router.delete('/phone/delete', async (req, res, next) => {
  console.log('DELETE person/phone/delete')
  try {
    const { phone } = req.body

    if (!phone) return res.status(400).send({ error: true, errorMsg: 'Request body malformed' })
    await Joi.validate(phone, bodyPhoneDelete)

    const personId = await Person.getId(phone.person_id)
    if (!personId) return res.status(404).send({ error: true, errorMsg: 'Person not found.' })

    const phoneId = await Phone.getId(phone.phone_id)
    if (!phoneId) return res.status(404).send({ error: true, errorMsg: 'Phone not found.' })

    let result = await Phone.deletePhone(personId, phoneId)

    // Logeo:
    if (req.user_id) {
      let userToLog = await User.findById(req.user_id)
      if (userToLog) {
        await log.register({
          username: userToLog.username,
          fullname: userToLog.full_name,
          email: userToLog.email,
          action: 'eliminación',
          message: `Le fue eliminado un número de teléfono a la persona ${person.person_id}`
        })
      }
    }

    return res.status(200).send({ error: false, results: true, Msg: 'Phone deleted.' })
  } catch (error) {
    next(error)
  }
})

router.get('/status/getall', async (req, res, next) => {
  try {
    let results = await PersonStatus.getAll()

    res.status(200).send({ error: false, results: results })

  } catch (error) {

    next(error)

  }
})

router.get('/history/get/:personId', async (req, res, next) => {
  try {
    const { personId } = req.params

    const whoIAm = await Person.getId(personId)

    if (!whoIAm) return res.status(404).send({ eror: true, errorMsg: 'Person not found.' })

    let result = await PersonHistory.findAll(whoIAm)

    return res.status(200).send({ error: false, results: result })

  } catch (error) {

    next(error)

  }
})

router.post('/history/create/', async (req, res, next) => {
  try {
    const { personId } = req.body

    const whoIAm = await Person.getId(personId)

    if (!whoIAm) return res.status(404).send({ eror: true, errorMsg: 'Person not found.' })

    let { history } = req.body

    if (!history.person_status_id) return res.status(500).send({ error: true, errorMsg: 'Bad body request.' })

    history.person_id = whoIAm

    let result = await PersonHistory.create(history)

    return res.status(200).send({ error: false, results: result })

  } catch (error) {

    next(error)

  }
})

router.get('/new-people', async (req, res, next) => {
  console.log('get person/new-people')
  try {
    const conditions = {
      person_status_id: 3,
      init_date: [
        momentz.tz(`${momentz.tz('America/Mexico_City').format('YYYY-MM-DD 00:00:00')}`, 'America/Mexico_City').tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
        momentz.tz(`${momentz.tz('America/Mexico_City').format('YYYY-MM-DD 23:59:59')}`, 'America/Mexico_City').tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
      ]
    }

    const new_people = await Person._findAll(conditions)

    res.status(200).send({
      total: new_people.length,
      page_number: null,
      number_entries: null,
      error: false,
      results: new_people
    })

  } catch (e) {
    next(e)
  }
})

router.get('/birthdates', async (req, res, next) => {
  console.log('GET person/birthdates')
  try {
    const today = momentz.tz('America/Mexico_City').format('YYYY-MM-DD')
    const birthdate_people = await Person._findAllBirthdates(today)

    res.status(200).send({
      total: birthdate_people.length,
      page_number: null,
      number_entries: birthdate_people.length || null,
      error: false,
      results: birthdate_people
    })

  } catch (e) {
    next(e)
  }
})

module.exports = router
