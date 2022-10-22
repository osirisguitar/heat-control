import KoaRouter from '@koa/router'
import rpio from 'rpio'

import { Control, ControlStatus, Status, ControlList } from '../../common/types'

const controls : ControlList = {
  'lower-temperature': {
    name: 'lower-temperature',
    pin: 7
  },
}

const getControlStatus = (control: Control) : ControlStatus => {
  rpio.open(control.pin, rpio.INPUT, rpio.PULL_DOWN)
  var state = rpio.read(control.pin)
  rpio.close(control.pin, rpio.PIN_PRESERVE)

  return {
    control,
    status: state ? Status.active : Status.inactive,
  }
}

const setControlStatus = (control: Control, status: Status) => {
  rpio.open(control.pin, rpio.OUTPUT)
  var state = rpio.write(control.pin, status === Status.active ? rpio.HIGH : rpio.LOW)
  rpio.close(control.pin, rpio.PIN_PRESERVE)
}

export const routes = (router: KoaRouter) => {
  router.get('/control/:control', (ctx) => {
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    const control = controls[params.control]

    if (!control) {
      ctx.status = 404
      ctx.body = { errorMessage: 'Control not found' }
      return
    }

    const status = getControlStatus(control)
    ctx.body = status
  })

  router.post('/control/:control/:status', (ctx) => {
    const { params } = ctx
    if (!params.control) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: control' }
      return
    }

    if (!params.status) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: status' }
      return
    } else if (params.status !== '0' && params.status !== '1') {
      ctx.status = 400
      ctx.body = { errorMessage: 'Bad value for parameter status: (must be 0 or 1)' }
      return
    }

    const control = controls[params.control]

    if (!control) {
      ctx.status = 404
      ctx.body = { errorMessage: 'Control not found' }
      return
    }

    setControlStatus(control, params.status === '1' ? Status.active : Status.inactive)
    ctx.body = { operation: 'ok' }
  })
}