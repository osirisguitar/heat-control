import KoaRouter from '@koa/router';

import { routes as controlRoutes } from './services/controlService'

const router = new KoaRouter();

router.get('/', async (ctx) => {
  ctx.body = 'Hello world';
});

router.post('/', async (ctx) => {
  ctx.body = ctx.request.body;
  ctx.set('X-Iteam-Header', ctx.get('X-Iteam-Header'));
});

controlRoutes(router)

export default router;
