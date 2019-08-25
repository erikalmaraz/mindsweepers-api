'use strict'

const setupDatabase = require('../lib/db')
const postgres = setupDatabase()

module.exports = class modelClass {
  createModel(data){
    return postgres.one(`INSERT INTO model(_name, category) VALUES ($1, $2) RETURNING id`, [data.name, data.category])
  }
  updateModel(data){
    let update = []
    if(data.name !== undefined) update.push(` _name = '${data.name}'`)
    if(data.category !== undefined) update.push(` category = '${data.category}'`)

    let cond = update.join(' , ')
    return postgres.one(`UPDATE model SET ${cond} WHERE id = ${data.model_id}`)
  }

  searchModel(data){
    let search = []
    if(data.name_exact !== undefined) search.push(` _name = '${data.name}'`)
    if(data.category_exact !== undefined) search.push(` category = '${data.name}'`)
    if(data.name !== undefined) search.push(` _name LIKE '%${data.name}%'`)
    if(data.category !== undefined) search.push(` category LIKE '%${data.name}%'`)
    if(data.model_id !== undefined) search.push(` id = '${data.model_id}'`)

    let cond = search.join(' AND ')
    return postgres.any(`SELECT * FROM model ${cond !== '' ? `WHERE ${cond}` : '' }`)
  }
}