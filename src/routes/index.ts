import { Router } from 'express';
const router = Router();

import authRoute from './auth.route';
import auditLogRoute from './audit-log.route';

router.use('/auth', authRoute);
router.use('/audit-logs', auditLogRoute);


export default router;
