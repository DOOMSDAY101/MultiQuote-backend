// src/routes/user.routes.ts
import { Router } from 'express';
import { createUserValidator, handleValidation, isAuthenticated, isSuperAdminOrAdmin, loginValidator, verifyLoginCodeValidator } from '../middlewares/auth.middleware';
import { createUser, loginUser, refreshToken, verifyLoginCode } from '../controllers/auth.controller';
import { auditLogger } from '../middlewares/audit-logger.middleware';
import { AuditActions } from '../enums/enums';
const router = Router();

/**
 * @swagger
 * /api/v1/auth/create-user:
 *   post:
 *     summary: Create a new user (Admin only)
 *     description: Allows an Admin or Super Admin to create a new user. The system generates a random password, saves it securely, and sends the credentials via email.
 *     tags:
 *       - Admin Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@mail.com
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               signature:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/user-signature.png"
 *     responses:
 *       201:
 *         description: User account created successfully and password emailed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User account created successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "c7b7f570-2e93-4e53-8b90-6d738c99a09c"
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@mail.com
 *                     role:
 *                       type: string
 *                       example: USER
 *       400:
 *         description: Bad request (Email already in use or validation failed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already in use
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

router.post(
    '/create-user',
    isAuthenticated,
    isSuperAdminOrAdmin,
    handleValidation(createUserValidator),
    auditLogger(AuditActions.CREATE_USER),
    createUser
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     description: User provides email and password. If valid, a 6-digit verification code is sent to their email. The user must use this code to complete login.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: testpassword
 *     responses:
 *       200:
 *         description: Verification code sent to user's email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 step:
 *                   type: string
 *                   example: verification_required
 *                 message:
 *                   type: string
 *                   example: Verification code sent to your email
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       403:
 *         description: Account inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Your account is currently inactive
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
router.post("/login", handleValidation(loginValidator), auditLogger(AuditActions.LOGIN_ATTEMPTS),
    loginUser);

/**
 * @swagger
 * /api/v1/auth/verify-login-code:
 *   post:
 *     summary: Verify login code
 *     description: User submits the 6-digit verification code sent to their email to complete login. Returns JWT token if successful.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 description: 6-digit verification code sent to email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful, JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "c7b7f570-2e93-4e53-8b90-6d738c99a09c"
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     role:
 *                       type: string
 *                       example: USER
 *       400:
 *         description: Invalid or expired verification code / invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid or expired verification code
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
router.post(
    "/verify-login-code",
    handleValidation(verifyLoginCodeValidator),
    auditLogger(AuditActions.VERIFY_EMAIL_TOKEN),
    verifyLoginCode
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     description: Uses a valid refresh token to issue a new access token (and refresh token).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 token:
 *                   type: string
 *                   example: "new-access-token-..."
 *                 refreshToken:
 *                   type: string
 *                   example: "new-refresh-token-..."
 *       400:
 *         description: Refresh token required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refresh token required
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid or expired refresh token
 *       403:
 *         description: User inactive or not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User inactive or no longer exists
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
router.post("/refresh-token", refreshToken);


export default router;
