import { Router } from 'express';
import { handleValidation, isAuthenticated, isSuperAdminOrAdmin } from '../middlewares/auth.middleware';
import { getUsersValidator } from '../middlewares/user.middleware';
import { getUsers } from '../controllers/user.controller';
import { multerErrorHandler, upload } from '../middlewares/upload.middleware';
import { createCompanyValidator, getCompaniesValidator, updateCompanyValidator } from '../middlewares/company.controller';
import { createCompany, getCompanies, updateCompany } from '../controllers/company.controller';
import { AuditActions } from '../enums/enums';
import { auditLogger } from '../middlewares/audit-logger.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/company:
 *   post:
 *     summary: Create a new company
 *     description: Creates a company with optional logo upload.
 *     tags:
 *       - Companies
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corporation"
 *                 description: Name of the company
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contact@acme.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1 555 123 4567"
 *               address:
 *                 type: string
 *                 example: "123 Industrial Avenue, Lagos"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Optional company logo image (jpg/png)
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company created successfully
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "8e12fa9d-913c-4c63-8f8f-b1dd4c54a24d"
 *                     name:
 *                       type: string
 *                       example: Acme Corporation
 *                     logo:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v1234/logo.png"
 *                     email:
 *                       type: string
 *                       example: contact@acme.com
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

router.post(
    '/',
    isAuthenticated,
    isSuperAdminOrAdmin,
    upload.single('logo'),
    multerErrorHandler,
    handleValidation(createCompanyValidator),
    auditLogger(AuditActions.CREATE_COMPANY),
    createCompany
);

/**
 * @swagger
 * /api/v1/company/{id}:
 *   put:
 *     summary: Update an existing company's details
 *     description: Updates company information and optionally uploads a new logo.
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corp International"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "support@acme.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1 555 987 6543"
 *               address:
 *                 type: string
 *                 example: "456 Updated Avenue, Abuja"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: New company logo (optional)
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */


router.put(
    '/:id',
    isAuthenticated,
    isSuperAdminOrAdmin,
    upload.single('logo'),
    multerErrorHandler,
    handleValidation(updateCompanyValidator),
    auditLogger(AuditActions.UPDATE_COMPANY),
    updateCompany
);

/**
 * @swagger
 * /api/v1/company:
 *   get:
 *     summary: Get all companies
 *     description: Retrieves paginated company list with optional search.
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "acme"
 *         description: Search companies by name, email, or phone number
 *     responses:
 *       200:
 *         description: Successfully retrieved companies
 *       500:
 *         description: Internal server error
 */
router.get(
    '/',
    isAuthenticated,
    handleValidation(getCompaniesValidator),
    getCompanies
);



export default router;