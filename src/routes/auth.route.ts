import { Router } from 'express';
import { createUserValidator, editUserValidator, handleValidation, isAuthenticated, isSuperAdminOrAdmin, loginValidator, toggleUserStatusValidator, verifyLoginCodeValidator } from '../middlewares/auth.middleware';
import { createUser, editUser, loginUser, refreshToken, resendLoginCode, toggleUserStatus, verifyLoginCode, verifyToken } from '../controllers/auth.controller';
import { auditLogger } from '../middlewares/audit-logger.middleware';
import { AuditActions } from '../enums/enums';
import { multerErrorHandler, upload } from '../middlewares/upload.middleware';
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
 *         multipart/form-data:
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
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 example: Doe
 *                 description: User's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@mail.com
 *                 description: User's email (must be unique)
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *                 description: Optional phone number
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, USER]
 *                 example: USER
 *                 description: User role
 *               img:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile image (jpg/png, max 5 MB)
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Optional signature image (jpg/png, max 5 MB)
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
 *         description: Bad request (validation failed or Multer error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File too large. Max 5 MB allowed.
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
    upload.fields([
        { name: 'img', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
    ]),                        // Multer middleware
    multerErrorHandler,         // Handle Multer errors ONLY
    handleValidation(createUserValidator),
    auditLogger(AuditActions.CREATE_USER),
    createUser                  // Your main controller
);

/**
 * @swagger
 * /api/v1/auth/edit-user/{id}:
 *   patch:
 *     summary: Edit an existing user (Admin only)
 *     description: Allows an Admin or Super Admin to edit user details. SUPER_ADMIN details cannot be edited except by another SUPER_ADMIN when updating password. All fields are optional. Password updates will send an email with the new password.
 *     tags:
 *       - Admin Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *                 example: jane.doe@mail.com
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number (digits only, may start with '+')
 *                 example: "+2348012345678"
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, USER]
 *                 description: User role (cannot edit SUPER_ADMIN role)
 *                 example: USER
 *               password:
 *                 type: string
 *                 description: Optional new password (will trigger email)
 *                 example: MyNewPass123
 *               img:
 *                 type: string
 *                 format: binary
 *                 description: Optional new profile image (jpg/png, max 5 MB)
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Optional new signature image (jpg/png, max 5 MB)
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "c7b7f570-2e93-4e53-8b90-6d738c99a09c"
 *                     firstName:
 *                       type: string
 *                       example: Jane
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     email:
 *                       type: string
 *                       example: jane.doe@mail.com
 *                     role:
 *                       type: string
 *                       example: USER
 *                     status:
 *                       type: string
 *                       example: Active
 *       400:
 *         description: Bad request (validation failed or Multer error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid phone number
 *       401:
 *         description: Unauthorized (User not logged in)
 *       403:
 *         description: Forbidden (Cannot edit SUPER_ADMIN details)
 *       404:
 *         description: User not found
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

router.patch(
    '/edit-user/:id',
    isAuthenticated,
    isSuperAdminOrAdmin,
    upload.fields([
        { name: 'img', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
    ]),                     // Multer middleware
    multerErrorHandler,      // Handle Multer errors ONLY
    handleValidation(editUserValidator),
    auditLogger(AuditActions.EDIT_USER),
    editUser
);

/**
 * @swagger
 * /api/v1/auth/user/{id}/toggle-status:
 *   patch:
 *     summary: Toggle a user's activation status (Admin only)
 *     description: Toggles a user's status between Active and Inactive. SUPER_ADMIN users cannot be toggled.
 *     tags:
 *       - Admin Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique ID of the user whose status is being toggled
 *     responses:
 *       200:
 *         description: User status successfully toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User is now Inactive
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
 *                     status:
 *                       type: string
 *                       enum: [Active, Inactive]
 *                       example: Inactive
 *       400:
 *         description: Bad request (validation failed)
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
 *                       message:
 *                         type: string
 *                         example: Invalid user ID
 *       401:
 *         description: Unauthorized (User not logged in)
 *       403:
 *         description: Forbidden (User not admin, super-admin, or trying to toggle SUPER_ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot change status of a SUPER_ADMIN user
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 */

router.patch(
    '/user/:id/toggle-status',
    isAuthenticated,
    isSuperAdminOrAdmin,
    handleValidation(toggleUserStatusValidator),
    auditLogger(AuditActions.TOGGLE_USER_STATUS),
    toggleUserStatus
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

/**
 * @swagger
 * /api/v1/auth/resend-code:
 *   post:
 *     summary: Resend login verification code
 *     description: Sends a new or existing valid verification code to the user's email to complete the login process.
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code resent
 *                 step:
 *                   type: string
 *                   example: verification_required
 *       400:
 *         description: Invalid email or user does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email
 *       403:
 *         description: User inactive or not allowed to continue login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account is inactive
 *       429:
 *         description: Too many code resend attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many attempts. Please wait before trying again.
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

router.post('/resend-code', resendLoginCode);


/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Verify current user's authentication token
 *     description: Checks if the provided JWT access token is valid. Returns the authenticated user's information if the token is valid.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Token is valid and user is authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token valid
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
 *       401:
 *         description: Unauthorized (No token provided or invalid/expired token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid or expired token
 *       403:
 *         description: Forbidden (User inactive or no longer exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User inactive or does not exist
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
router.get('/me', verifyToken);


export default router;
