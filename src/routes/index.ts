import { Router } from 'express';
const router = Router();

import authRoute from './auth.route';
import auditLogRoute from './audit-log.route';
import userRoute from './user.route';
import companyRoute from './company.route';

router.use('/auth', authRoute);
router.use('/audit-logs', auditLogRoute);
router.use('/users', userRoute);
router.use('/company', companyRoute);


export default router;
