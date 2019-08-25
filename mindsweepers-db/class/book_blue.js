'use strict'

const setupDatabase = require('../lib/db')
const postgres = setupDatabase()

module.exports = class bookBlueClass {
  createBookBlue(data){
    return postgres.one(`INSERT INTO book_blue(year, cylindrical, kilometers, product_id) 
                          VALUES ($1, $2, $3, $4) RETURNING id`, [data.year, data.cylindrical, JSON.stringify(data.kilometers), data.product_id])
  }
  updateBookBlue(data){
    let update = []
    if(data.year !== undefined) update.push(` year = '${data.year}'`)
    if(data.cylindrical !== undefined) update.push(` cylindrical = '${data.cylindrical}'`)
    if(data.kilometers !== undefined) update.push(` kilometers = '${JSON.stringify(data.kilometers)}'`)
    if(data.product_id !== undefined) update.push(` product_id = '${data.product_id}'`)

    let cond = update.join(' , ')
    return postgres.one(`UPDATE book_blue SET ${cond} WHERE id = ${data.book_blue_id}`)
  }

  searchBookBlue(data){
    let search = []
    if(data.year !== undefined) search.push(` a.year = '${data.year}'`)
    if(data.cylindrical !== undefined) search.push(` a.cylindrical = '${data.cylindrical}'`)
    if(data.kilometers !== undefined) search.push(` a.kilometers = '${JSON.stringify(data.kilometers)}'`)
    if(data.product_name !== undefined) search.push(` b._name LIKE '%${data.product_name}%'`)
    if(data.product_name_exact !== undefined) search.push(` b._name = '${data.product_name_exact}'`)
    if(data.product_id !== undefined) search.push(` a.product_id = '${data.product_id}'`)
    if(data.book_blue_id !== undefined) search.push(` a.id = '${data.book_blue_id}'`)

    let cond = search.join(' AND ')
    return postgres.any(`SELECT * 
                        FROM book_blue a INNER JOIN production b ON a.product_id = b.id
                        ${cond !== '' ? `WHERE ${cond}` : '' }`)
  }

}