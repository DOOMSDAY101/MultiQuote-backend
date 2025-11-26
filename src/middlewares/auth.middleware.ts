import { Request, Response, NextFunction } from "express";
import { body, ValidationChain, validationResult } from "express-validator";
import { config } from "../config/env";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { BasicStatus, UserRole } from "../models/user.model";

export const handleValidation = (rules: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Run all validation rules
        for (let rule of rules) {
            await rule.run(req);
        }

        // Check for validation result
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorArray = errors.array().map((error) => error.msg);
            return res.status(400).json({ errors: errorArray });
        }

        next();
    };
};

export const isSuperAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user as JwtPayload & { role: UserRole };

    if (user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
            message: 'Forbidden: Super Admins only',
        });
    }

    next();
};

export const isSuperAdminOrAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user as JwtPayload & { role: UserRole };

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user?.role)) {
        return res.status(403).json({
            message: 'Forbidden: Only Admins are allowed',
        });
    }

    next();
};

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload & { role: UserRole };

        // Find the user in DB
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({
                status: 'Unauthorized',
                message: 'Missing or invalid credentials',
                statusCode: 401,
            });
        }

        if (user.status !== BasicStatus.Active) {
            return res.status(403).json({
                status: 'Forbidden',
                message: 'Your account is currently inactive',
                statusCode: 403,
            });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

export const createUserValidator: ValidationChain[] = [
    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .isString()
        .withMessage("First name must be a string"),

    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .isString()
        .withMessage("Last name must be a string"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),

    body("phoneNumber")
        .optional()
        .trim()
        .matches(/^\+?\d+$/)
        .withMessage("Phone number must contain only digits and may start with '+'"),

    body("signature")
        .optional()
        .trim()
        .isURL()
        .withMessage("Signature must be a valid URL"),

    body("role")
        .optional()
        .isIn(Object.values(UserRole))
        .withMessage(`Role must be one of: ${Object.values(UserRole).join(", ")}`),
];

export const loginValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),

    body("password")
        .trim()
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
];

export const verifyLoginCodeValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),

    body("code")
        .trim()
        .notEmpty()
        .withMessage("Verification code is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("Verification code must be exactly 6 digits")
        .isNumeric()
        .withMessage("Verification code must contain only numbers"),
];