import KoaRouter from '@koa/router'
import sqlite3 from 'sqlite3'

import { Control, State, ControlSchedule, ControlState } from '../../common/types'

let db : sqlite3.Database

const openDatabase = async (dbFileName: string) : Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbFileName, (err) => {
      if (err) {
        console.error('Error opening database', err)
        return reject(err)
      }

      console.log('db open')

      return resolve(true)
    })
  })
}

const get = async (query: string, params?: any) : Promise<any[]> => {
  if (!db) {
    await initializeDatabase()
  }

  return new Promise((resolve, reject) => {
    db.all(query, params, (err, row) => {
      if (err) {
        console.error('Error querying database', err)
        return reject(err)
      }

      resolve(row)
    })
  })
}

const run = async (query: string, params?: any) => {
  if (!db) {
    await initializeDatabase()
  }

  return new Promise((resolve, reject) => {
    db.run(query, params, (err) => {
      if (err) {
        console.error('Error querying database', err)
        return reject(err)
      }

      resolve(null)
    })
  })
}

const initializeDatabase = async () => {
  if (!db) {
    await openDatabase('heatcontrol.db')
  }

  let result = await get('SELECT name FROM sqlite_schema WHERE type=\'table\' AND name=\'control_schedule\';')
  if (!result || !result[0]) {
    await run('CREATE TABLE control_schedule (control_name TEXT NOT NULL, state INTEGER NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL)')
    console.log('Created table control_schedule')
  } else {
    console.log(result)
  }

  result = await get('SELECT name FROM sqlite_schema WHERE type=\'table\' AND name=\'state_log\';')
  if (!result || !result[0]) {
    await run('CREATE TABLE state_log (state_change_date TEXT NOT NULL, control_name TEXT NOT NULL, state INTEGER NOT NULL)')
    console.log('Created table state_log')
  } else {
    console.log(result)
  }

  result = await await get('SELECT name FROM sqlite_schema WHERE type=\'table\' AND name=\'hour_prices\';')
  if (!result || !result[0]) {
    await run('CREATE TABLE hour_prices (price_date TEXT NOT NULL, price INTEGER NOT NULL)')
    console.log('Created table state_log')
  } else {
    console.log(result)
  }
}

const getDesiredControlState = async (controlName: string, date?: string) : Promise<ControlState> => {
  const results = await get('SELECT rowid, * FROM control_schedule WHERE from_date < datetime(\'now\', \'localtime\') AND to_date > datetime(\'now\', \'localtime\') AND control_name = $control_name',
  {
    $control_name: controlName
  })

  let state = State.inactive // default state when no explicit schedule exists

  if (results && results[0]) {
    state = results[0].state
  }

  const controlState = {
    control: {
      name: controlName,
    },
    state
  }

  return controlState
}

const getCurrentAndFutureSchedules = async (controlName: string) => {
  const results = await get('SELECT rowid, * FROM control_schedule WHERE to_date > datetime(\'now\', \'localtime\') and control_name = $control_name ORDER BY from_date', { "$control_name": controlName })

  return results;
}

const getSchedule = async(scheduleId: number) => {
  const results = await get('SELECT rowid, * FROM control_schedule WHERE rowid = $rowid', { '$rowid': scheduleId })

  return results
}

const insertSchedule = async (schedule: ControlSchedule) => {
  await run('INSERT INTO control_schedule (control_name, state, from_date, to_date) VALUES ($control_name, $state, $from_date, $to_date)', 
  {
    $control_name: schedule.controlName,
    $state: schedule.schedule.state,
    $from_date: schedule.schedule.from,
    $to_date: schedule.schedule.to,
  })
}

const updateSchedule = async (id: Number, schedule: ControlSchedule) => {
  console.log('updating')
  await run('UPDATE control_schedule SET control_name = $control_name, state = $state, from_date = $from_date, to_date = $to_date WHERE rowid = $id', 
  {
    $control_name: schedule.controlName,
    $state: schedule.schedule.state,
    $from_date: schedule.schedule.from,
    $to_date: schedule.schedule.to,
    $id: id,
  })

  console.log('done')
}

const deleteSchedule = async(scheduleId: number) => {
  await run('DELETE FROM control_schedule WHERE rowid = $rowid', { '$rowid': scheduleId })
}

export {
  getDesiredControlState
}

export const routes = (router: KoaRouter) => {
  router.get('/schedule/:control', async (ctx) => {
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    const schedules = await getCurrentAndFutureSchedules(params.control)
    console.log(schedules)
    ctx.body = schedules
  })

  router.get('/schedule/:control/current', async (ctx) => {
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    try {
      const state = await getDesiredControlState(params.control)
      console.log(state)
      ctx.body = { state }  
    } catch (err) {
      ctx.status = 404
      ctx.body = { errorMessage: 'No current state found for control (not even default)' }
    }
  })

  router.get('/schedule/:control/:scheduleid', async (ctx) => {
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    try {
      const state = await getSchedule(Number(params.scheduleid))
      console.log(state)
      ctx.body = { state }  
    } catch (err) {
      ctx.status = 404
      ctx.body = { errorMessage: 'Schedule not found' }
    }
  })

  router.delete('/schedule/:control/:scheduleid', async (ctx) => {
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    try {
      await deleteSchedule(Number(params.scheduleid))
      ctx.status = 204
    } catch (err) {
      ctx.status = 404
      ctx.body = { errorMessage: 'Schedule not found' }
    }
  })

  router.post('/schedule/:control/:scheduleid', async (ctx) => {
    console.log('update schedule')
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    const { body } = ctx.request

    const controlSchedule = {
      controlName: params.control,
      schedule: {
        from: body?.from as string,
        to: body?.to as string,
        state: body?.state as State,
      }
    }

    await updateSchedule(Number(params.scheduleid), controlSchedule)

    ctx.body = { operation: 'ok' }
  })

  router.post('/schedule/:control', async (ctx) => {
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    const { body } = ctx.request

    const controlSchedule = {
      controlName: params.control,
      schedule: {
        from: body?.from as string,
        to: body?.to as string,
        state: body?.state as State,
      }
    }

    await insertSchedule(controlSchedule)

    ctx.body = { operation: 'ok' }
  })
}
