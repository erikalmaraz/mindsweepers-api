'use strict'

const setupDatabase = require('../lib/db')
const postgres = setupDatabase()

module.exports = class maintenanceTypeClass {
  createMaintenanceType(data){
    return postgres.one(`INSERT INTO maintenance_type(_name, description) VALUES ($1, $2) RETURNING id`, [data.name, data.description])
  }
  updateMaintenanceType(data){
    let update = []
    if(data.name !== undefined) update.push(` _name = '${data.name}'`)
    if(data.description !== undefined) update.push(` description = '${data.name}'`)

    let cond = update.join(' , ')
    return postgres.one(`UPDATE maintenance_type SET ${cond} WHERE id = ${data.maintenance_type_id}`)
  }
  searchMaintenanceType(data){
    let search = []
    if(data.name_exact !== undefined) search.push(` _name = '${data.name}'`)
    if(data.name !== undefined) search.push(` _name LIKE '%${data.name}%'`)
    if(data.description !== undefined) search.push(` description like '${data.description}'`)
    if(data.maintenance_type_id !== undefined) search.push(` id = '${data.maintenance_type_id}'`)

    let cond = search.join(' AND ')
    return postgres.any(`SELECT * FROM maintenance_type ${cond !== '' ? `WHERE ${cond}` : '' }`)
  }


}