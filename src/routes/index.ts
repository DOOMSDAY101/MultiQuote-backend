import { Router } from 'express';
const router = Router();

import testRoute from './test.route';

router.use('/', testRoute);


export default router;
