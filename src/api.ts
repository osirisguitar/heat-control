import KoaRouter from '@koa/router';
import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async'

import { routes as controlRoutes, controls, getControlState, setControlState } from './services/controlService'
import { routes as scheduleRoutes, getDesiredControlState } from './services/scheduleService'

const router = new KoaRouter();

router.get('/', async (ctx) => {
  ctx.body = 'Hello world';
});

router.post('/', async (ctx) => {
  ctx.body = ctx.request.body;
  ctx.set('X-Iteam-Header', ctx.get('X-Iteam-Header'));
});

controlRoutes(router)
scheduleRoutes(router)

export default router;

const updateControlsFromSchedule = async () => {
  Object.values(controls).forEach(async (control) => {
    const desiredState = await getDesiredControlState(control.name)
    const currentState = getControlState(control)

    if (desiredState.state !== currentState.state) {
      setControlState(control, desiredState.state)
      console.log('Changed state for control', control.name, 'to', desiredState.state)
    }
  })
} 

setIntervalAsync(async () => {
  await updateControlsFromSchedule()
}, 10000)
