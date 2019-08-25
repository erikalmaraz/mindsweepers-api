'use strict'

const setupDatabase = require('../lib/db')
const postgres = setupDatabase()

module.exports = class productClass {
  createProduct(data){
    return postgres.one(`INSERT INTO product(_name, detail, model_id) 
                          VALUES($1, $2, $3) RETURNING id`, [data.name, data.detail, data.model_id])
  }

  updateProduct(data){
    let update = []
    if(data.name !== undefined) update.push(` _name = '${data.name}'`)
  }

}