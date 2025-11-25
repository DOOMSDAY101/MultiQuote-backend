import { Request, Response } from "express";
import AuditLog from "../models/audit-log.model";
import LoginHistory from "../models/login-history.model";
import { Op, WhereOptions } from "sequelize";

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { action, user_role, ip_address, method, success, user_id } = req.query;

        const where: WhereOptions = {};

        if (action) {
            where.action = { [Op.iLike]: `%${action}%` }; // case-insensitive
        }
        if (user_role) {
            where.user_role = { [Op.iLike]: `%${user_role}%` };
        }
        if (method) {
            where.method = { [Op.iLike]: `%${method}%` };
        }
        if (ip_address) {
            where.ip_address = { [Op.iLike]: `%${ip_address}%` };
        }
        if (user_id) {
            where.user_id = { [Op.eq]: user_id };
        }
        if (success !== undefined) {
            where.success = success === "true";
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            include: [
                {
                    model: LoginHistory,
                    as: "loginSession",
                    attributes: [
                        "id",
                        "ipAddress",
                        "city",
                        "region",
                        "country",
                        "browser",
                        "os",
                        "deviceType",
                        "userAgent",
                        "loginTime",
                        "logoutTime",
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });

        res.status(200).json({
            message: "Audit logs fetched successfully",
            pagination: {
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                pageSize: limit,
            },
            data: rows,
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({
            message: "Failed to fetch audit logs",
        });
    }
};
