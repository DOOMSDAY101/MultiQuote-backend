import { Router } from 'express';
import { handleValidation, isSuperAdminOrAdmin } from '../middlewares/auth.middleware';
import { auditLogQueryValidator } from '../middlewares/audit-logger.middleware';
import { getAuditLogs } from '../controllers/audit-log.controller';

const router = Router();


/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Get all audit logs
 *     description: Retrieve a paginated list of audit logs. Optionally filter by action, user role, method, IP, success, or login session details.
 *     tags:
 *       - Audit Logs
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Page number for pagination (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Number of records per page (default: 10)"
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter logs by action name (case-insensitive, partial match)
 *       - in: query
 *         name: user_role
 *         schema:
 *           type: string
 *         description: Filter logs by user role (case-insensitive)
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *         description: Filter logs by HTTP method (GET, POST, etc.)
 *       - in: query
 *         name: ip_address
 *         schema:
 *           type: string
 *         description: Filter logs by IP address (partial match allowed)
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter logs by specific user ID
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter logs by success status (true or false)
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *         description: Filter by login device type (desktop, smartphone, tablet)
 *       - in: query
 *         name: browser
 *         schema:
 *           type: string
 *         description: Filter by login browser (e.g., Chrome, Firefox)
 *       - in: query
 *         name: os
 *         schema:
 *           type: string
 *         description: Filter by operating system (e.g., Windows, macOS)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by login city
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by login country
 *     responses:
 *       200:
 *         description: Paginated list of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Audit logs fetched successfully
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: integer
 *                       example: 120
 *                     totalPages:
 *                       type: integer
 *                       example: 12
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       action:
 *                         type: string
 *                         example: LOGIN_VERIFICATION
 *                       method:
 *                         type: string
 *                         example: POST
 *                       request_payload:
 *                         type: string
 *                         example: '{"email":"user@example.com"}'
 *                       response_payload:
 *                         type: string
 *                         example: '{"message":"Login successful","token":"..."}'
 *                       response_length:
 *                         type: integer
 *                         example: 1
 *                       status_code:
 *                         type: integer
 *                         example: 200
 *                       ip_address:
 *                         type: string
 *                         example: 192.168.1.10
 *                       user_agent:
 *                         type: string
 *                         example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *                       user_id:
 *                         type: string
 *                         example: "c7b7f570-2e93-4e53-8b90-6d738c99a09c"
 *                       user_role:
 *                         type: string
 *                         example: ADMIN
 *                       success:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-11-25T12:34:56Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-11-25T12:34:56Z
 *                       loginSession:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           userId:
 *                             type: string
 *                           ipAddress:
 *                             type: string
 *                             example: 192.168.1.10
 *                           city:
 *                             type: string
 *                             example: San Francisco
 *                           region:
 *                             type: string
 *                             example: California
 *                           country:
 *                             type: string
 *                             example: US
 *                           browser:
 *                             type: string
 *                             example: Chrome
 *                           os:
 *                             type: string
 *                             example: Windows
 *                           deviceType:
 *                             type: string
 *                             example: desktop
 *                           userAgent:
 *                             type: string
 *                             example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *                           loginTime:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-11-25T12:30:00Z
 *                           logoutTime:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-11-25T14:00:00Z
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Page must be a positive integer"]
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - user does not have permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: Only Admins are allowed"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch audit logs
 */

router.get(
    "/",
    isSuperAdminOrAdmin,
    handleValidation(auditLogQueryValidator),
    getAuditLogs
);

export default router;
