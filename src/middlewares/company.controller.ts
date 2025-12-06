import { body, param, query } from 'express-validator';

export const createCompanyValidator = [
    body('name')
        .notEmpty()
        .withMessage('Company name is required')
        .isString()
        .withMessage('Company name must be a string')
        .trim(),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format'),

    body('phoneNumber')
        .optional()
        .isString()
        .withMessage('Phone number must be a string'),

    body('address')
        .optional()
        .isString()
        .withMessage('Address must be a string'),
];

export const updateCompanyValidator = [
    param('id')
        .notEmpty()
        .withMessage('Company ID is required')
        .isUUID()
        .withMessage('Invalid company ID'),

    body('name')
        .optional()
        .isString()
        .withMessage('Company name must be a string'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format'),

    body('phoneNumber')
        .optional()
        .isString()
        .withMessage('Phone number must be a string'),

    body('address')
        .optional()
        .isString()
        .withMessage('Address must be a string'),
];

export const getCompaniesValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Limit must be a positive integer'),

    query('search')
        .optional()
        .isString()
        .trim()
        .withMessage('Search must be a string'),
];
