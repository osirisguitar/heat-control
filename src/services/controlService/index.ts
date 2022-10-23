import KoaRouter from '@koa/router'
import rpio from 'rpio'

import { Control, ControlState, State, ControlList } from '../../common/types'

const controls : ControlList = {
  'lower-temperature': {
    name: 'lower-temperature',
    pin: 7
  },
}

Object.values(controls).forEach(control => {
  console.log('Opening', control)

  if (!control.pin) {
    throw new Error('Control cannot be opened, pin is null')
  }

  rpio.open(control.pin, rpio.OUTPUT)
})

const getControlState = (control: Control) : ControlState => {
  if (!control.pin) {
    throw new Error('Control cannot be opened, pin is null')
  }

  var state = rpio.read(control.pin)

  return {
    control,
    state: state ? State.active : State.inactive,
  }
}

const setControlState = (control: Control, status: State) => {
  if (!control.pin) {
    throw new Error('Control cannot be opened, pin is null')
  }

  rpio.write(control.pin, status === State.active ? rpio.HIGH : rpio.LOW)
}

export {
  getControlState,
  setControlState,
  controls
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

    const status = getControlState(control)
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

    setControlState(control, params.status === '1' ? State.active : State.inactive)
    ctx.body = { operation: 'ok' }
  })
}
