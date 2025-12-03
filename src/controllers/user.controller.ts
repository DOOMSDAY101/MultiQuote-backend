import { Request, Response } from 'express';
import User, { BasicStatus, UserRole } from '../models/user.model';
import { Op } from 'sequelize';

export const getUsers = async (req: Request, res: Response) => {
    try {
        // Pagination params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Search term
        const search = (req.query.search as string) || '';
        const role = req.query.role as UserRole | undefined;
        const status = req.query.status as BasicStatus | undefined;

        // Build where clause
        const whereClause: any = {};
        if (search) {
            whereClause[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }

        if (role) {
            whereClause.role = role;
        }

        // Status filter
        if (status) {
            whereClause.status = status;
        }


        // Fetch users with pagination
        const { rows: users, count: total } = await User.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] },
        });

        return res.status(200).json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
