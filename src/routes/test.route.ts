// src/routes/user.routes.ts
import { Router } from 'express';
const router = Router();

/**
 * @swagger
 * /api/v1/test:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 */
router.get('/test', (req, res) => {
    res.json([{ id: 1, name: 'John Doe' }]);
});

export default router;
