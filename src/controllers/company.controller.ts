import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Company from '../models/companies.model';
import { uploadToCloudinary } from '../config/cloudinary';
import { formatPhoneNumber } from '../helpers/helper-function';

export const createCompany = async (req: Request, res: Response) => {
    try {
        const { name, email, phoneNumber, address, status } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Company name is required' });
        }

        let formattedPhone: string | undefined = undefined;
        if (phoneNumber) {
            try {
                formattedPhone = formatPhoneNumber(phoneNumber);
            } catch (err: any) {
                return res.status(400).json({ message: err.message });
            }
        }
        let logoUrl: string | undefined = undefined;

        // If logo file is uploaded
        if (req.file) {
            logoUrl = await uploadToCloudinary(req.file.buffer, '/Multiquote/company_logos');
        }

        const company = await Company.create({
            name,
            logo: logoUrl,
            email,
            phoneNumber: formattedPhone,
            address,
        });

        return res.status(201).json({
            message: 'Company created successfully',
            company,
        });
    } catch (error) {
        console.error('Create company error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateCompany = async (req: Request, res: Response) => {
    try {
        const companyId = req.params.id;
        const updates = req.body;

        const company = await Company.findByPk(companyId);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        if (updates.phoneNumber) {
            try {
                updates.phoneNumber = formatPhoneNumber(updates.phoneNumber);
            } catch (err: any) {
                return res.status(400).json({ message: err.message });
            }
        }

        if (req.file) {
            const logoUrl = await uploadToCloudinary(req.file.buffer, '/Multiquote/company_logos');
            updates.logo = logoUrl;
        }


        await company.update(updates);

        return res.status(200).json({
            message: 'Company updated successfully',
            company,
        });
    } catch (error) {
        console.error('Update company error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCompanies = async (req: Request, res: Response) => {
    try {
        // Pagination params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Search
        const search = (req.query.search as string) || '';

        // Where clause
        const whereClause: any = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phoneNumber: { [Op.iLike]: `%${search}%` } },
            ];
        }

        // Fetch companies
        const { rows: companies, count: total } = await Company.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            companies,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get companies error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
