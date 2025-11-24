import { Router } from 'express';
const router = Router();

import authRoute from './auth.route';

router.use('/auth', authRoute);


export default router;
