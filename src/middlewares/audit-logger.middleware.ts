import { Request, Response, NextFunction } from 'express';
import { query, ValidationChain } from "express-validator";
import jwt, { JwtPayload } from 'jsonwebtoken';
import onFinished from 'on-finished';
import { config } from '../config/env';
import AuditLog from '../models/audit-log.model';

const JWT_SECRET = config.JWT_SECRET as string;

export const sanitizeRequestBody = (body: any) => {
    const copy = { ...body };
    if (copy.password) copy.password = '[REDACTED]';
    if (copy.confirmPassword) copy.confirmPassword = '[REDACTED]';
    return copy;
};
export const sanitizeResponseBody = (obj: any): any => {
    return JSON.parse(
        JSON.stringify(obj, (key, value) => {
            if (!key) return value; // root object
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes("password") || lowerKey.includes("token") || lowerKey.includes("refreshToken")) {
                return "[REDACTED]";
            }
            return value;
        })
    );
};


export const auditLogger = (action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        let userId: string | undefined;
        let userRole = 'unknown';
        let logWritten = false;

        // Extract JWT token from headers or cookies
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        if (token) {
            try {
                const decoded: any = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
                userRole = decoded.user_role || 'unknown';
            } catch {
                // ignore invalid tokens, userId stays undefined
            }
        }

        const ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const sanitizedRequest = sanitizeRequestBody(req.body);

        const logAudit = async (body: any, statusCode: number) => {
            if (logWritten) return;
            logWritten = true;
            const sanitizedResponse = sanitizeResponseBody(body);

            const log = await AuditLog.create({
                action,
                method: req.method,
                request_payload: JSON.stringify(sanitizedRequest),
                response_payload: JSON.stringify(sanitizedResponse),
                status_code: statusCode,
                ip_address: ipAddress,
                user_agent: userAgent,
                user_id: userId || undefined,
                user_role: userRole,
                success: statusCode >= 200 && statusCode < 400,
                login_history_id: req.loginHistoryId || undefined,
            });

            log.computeResponseLength();
            await log.save();
        };

        // Intercept res.json
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            process.nextTick(() => logAudit(body, res.statusCode));
            return originalJson(body);
        };

        // Intercept res.send
        const originalSend = res.send.bind(res);
        res.send = (body: any) => {
            process.nextTick(() => logAudit(body, res.statusCode));
            return originalSend(body);
        };

        // Fallback for errors
        onFinished(res, () => {
            if (!logWritten) {
                logAudit({ message: 'Unhandled error or non-2xx response' }, res.statusCode);
            }
        });

        next();
    };
};


export const auditLogQueryValidator: ValidationChain[] = [
    // Pagination
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Limit must be a positive integer"),

    // Filters
    query("action")
        .optional()
        .isString()
        .withMessage("Action must be a string"),

    query("user_role")
        .optional()
        .isString()
        .withMessage("User role must be a string"),

    query("method")
        .optional()
        .isString()
        .withMessage("Method must be a string"),

    query("ip_address")
        .optional()
        .isString()
        .withMessage("IP address must be a string"),

    query("user_id")
        .optional()
        .isString()
        .withMessage("User ID must be a string"),

    query("success")
        .optional()
        .isBoolean()
        .withMessage("Success must be either true or false")
        .toBoolean(), // Converts "true"/"false" string to boolean

    // Optional: Filtering via login session fields
    query("deviceType")
        .optional()
        .isString()
        .withMessage("Device type must be a string"),
    query("browser")
        .optional()
        .isString()
        .withMessage("Browser must be a string"),
    query("os")
        .optional()
        .isString()
        .withMessage("OS must be a string"),
    query("city")
        .optional()
        .isString()
        .withMessage("City must be a string"),
    query("country")
        .optional()
        .isString()
        .withMessage("Country must be a string"),
];
