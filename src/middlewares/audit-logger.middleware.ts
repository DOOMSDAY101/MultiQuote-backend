import { Request, Response, NextFunction } from 'express';
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
        const sanitizedRequest = sanitizeRequestBody({ params: req.params, query: req.query, body: req.body });

        const logAudit = async (body: any, statusCode: number) => {
            if (logWritten) return;
            logWritten = true;

            const log = await AuditLog.create({
                action,
                method: req.method,
                request_payload: JSON.stringify(sanitizedRequest),
                response_payload: JSON.stringify(body),
                status_code: statusCode,
                ip_address: ipAddress,
                user_agent: userAgent,
                user_id: userId || undefined,
                user_role: userRole,
                success: statusCode >= 200 && statusCode < 400,
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