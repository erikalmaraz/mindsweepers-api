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
    if(data.detail !== undefined) update.push(` detail = '${data.detail}'`)
    if(data.model !== undefined) update.push(` model_id = '${data.model}'`)

    let cond = update.join(' , ')
    return postgres.one(`UPDATE product SET ${cond} WHERE id = ${data.product_id}`)
  }

  searchProduct(data){
    let search = []
    if(data.name_extact !== undefined) search.push(` a._name = '${data.name}'`)
    if(data.name_extact !== undefined) search.push(` a._name LIKE '%${data.name}%'`)
    if(data.detail !== undefined) search.push(` a.detail = '${data.detail}'`)
    if(data.model_id !== undefined) search.push(` a.model_id = '${data.model_id}'`)
    if(data.model_name_exact !== undefined) search.push(` b._name = '${data.model_name}'`)
    if(data.model_name !== undefined) search.push(` b._name LIKE '%${data.model_name}%'`)

    let cond = search.join(' AND ')

    return postgres.any(`SELECT a._name, a.detail, a.model_id, b._name AS model_name
                        FROM product a INNER JOIN model b ON a.id_model = b.id
                        ${cond !== '' ? `WHERE ${cond}` : '' }`)
  }

}