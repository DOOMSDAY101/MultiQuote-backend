import { query } from 'express-validator';
import { BasicStatus, UserRole } from '../models/user.model';

export const getUsersValidator = [
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

    query('role')
        .optional()
        .isIn(Object.values(UserRole))
        .withMessage(`Role must be one of: ${Object.values(UserRole).join(', ')}`),

    query('status')
        .optional()
        .isIn(Object.values(BasicStatus))
        .withMessage(`Status must be one of: ${Object.values(BasicStatus).join(', ')}`),
];
