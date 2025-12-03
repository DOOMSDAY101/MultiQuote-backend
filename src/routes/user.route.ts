import { Router } from 'express';
import { handleValidation, isAuthenticated, isSuperAdminOrAdmin } from '../middlewares/auth.middleware';
import { getUsersValidator } from '../middlewares/user.middleware';
import { getUsers } from '../controllers/user.controller';

const router = Router();
/**
* @swagger 
* /api/v1/users:
*   get:
*     summary: Get a list of users (Admin only)
*     description: Fetches a paginated list of all users in the system. Supports search by name/email and optional filtering by role or status.
*     tags:
*       -  Users
*     parameters:
*       - in: query
*         name: page
*         schema:
*           type: integer
*           default: 1
*         description: Page number for pagination
*       - in: query
*         name: limit
*         schema:
*           type: integer
*           default: 10
*         description: Number of users per page
*       - in: query
*         name: search
*         schema:
*           type: string
*         description: Search term to filter users by first name, last name, or email
*       - in: query
*         name: role
*         schema:
*           type: string
*           enum: [SUPER_ADMIN, ADMIN, USER]
*         description: Filter users by role
*       - in: query
*         name: status
*         schema:
*           type: string
*           enum: [Active, Inactive]
*         description: Filter users by status
*     responses:
*       200:
*         description: Successfully fetched users
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 users:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       id:
*                         type: string
*                         example: "c7b7f570-2e93-4e53-8b90-6d738c99a09c"
*                       firstName:
*                         type: string
*                         example: Alice
*                       lastName:
*                         type: string
*                         example: Johnson
*                       email:
*                         type: string
*                         example: alice.johnson@example.com
*                       role:
*                         type: string
*                         example: ADMIN
*                       status:
*                         type: string
*                         example: Active
*                       img:
*                         type: string
*                         format: url
*                         example: "https://i.pravatar.cc/40?img=1"
*                       phoneNumber:
*                         type: string
*                         example: "+1234567890"
*                 pagination:
*                   type: object
*                   properties:
*                     total:
*                       type: integer
*                       example: 25
*                     page:
*                       type: integer
*                       example: 1
*                     limit:
*                       type: integer
*                       example: 10
*                     totalPages:
*                       type: integer
*                       example: 3
*       400:
*         description: Bad request (invalid query parameters)
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 errors:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       msg:
*                         type: string
*                         example: Page must be a positive integer
*                       param:
*                         type: string
*                         example: page
*                       location:
*                         type: string
*                         example: query
*       401:
*         description: Unauthorized (User not logged in)
*       403:
*         description: Forbidden (User not admin or super-admin)
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Internal server error
*/
router.get(
    '/',
    isAuthenticated,
    isSuperAdminOrAdmin,
    handleValidation(getUsersValidator),
    getUsers
);

export default router;