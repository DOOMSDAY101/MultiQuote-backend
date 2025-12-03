import { Router } from 'express';
const router = Router();

import authRoute from './auth.route';
import auditLogRoute from './audit-log.route';
import userRoute from './user.route';

router.use('/auth', authRoute);
router.use('/audit-logs', auditLogRoute);
router.use('/users', userRoute);


export default router;
