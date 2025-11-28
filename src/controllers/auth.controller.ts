import { Request, Response } from 'express';
import User, { BasicStatus, UserRole } from '../models/user.model';
import { createLoginSession, formatPhoneNumber, generateRandomPassword, getIPDetails, signRefreshToken, signToken } from '../helpers/helper-function';
import { sendUserPasswordEmail, sendVerificationCodeEmail } from '../middlewares/email.middleware';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { VerificationToken } from '../models/verification-token.model';
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from '../config/env';


export const createUser = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, phoneNumber, signature, role = UserRole.USER } = req.body;

        // Check for existing user
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        let formattedPhone: string | undefined = undefined;
        if (phoneNumber) {
            try {
                formattedPhone = formatPhoneNumber(phoneNumber);
            } catch (error) {
                return res.status(400).json({ message: (error as Error).message });
            }
        }


        // Generate password
        const plainPassword = generateRandomPassword();

        const user = await User.create({
            firstName,
            lastName,
            email,
            phoneNumber: formattedPhone,
            signature,
            password: plainPassword,
            role,
            status: BasicStatus.Active,
        });

        // Send email
        await sendUserPasswordEmail(email, firstName, plainPassword);

        return res.status(201).json({
            message: 'User account created successfully',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        if (user.status !== BasicStatus.Active)
            return res.status(403).json({ message: "Your account is currently inactive" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        let tokenRecord = await VerificationToken.findOne({
            where: {
                userId: user.id,
                expiresAt: { [Op.gt]: new Date() },
            },
        });

        if (!tokenRecord) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            tokenRecord = await VerificationToken.create({
                userId: user.id,
                token: code,
                expiresAt,
            });
        }

        await sendVerificationCodeEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            tokenRecord.token
        );

        return res.status(200).json({
            step: "verification_required",
            message: "Verification code sent to your email",
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyLoginCode = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const tokenRecord = await VerificationToken.findOne({
            where: {
                userId: user.id,
                token: code,
                expiresAt: { [Op.gt]: new Date() },
            },
        });

        if (!tokenRecord) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        await tokenRecord.destroy();


        const loginSession = await createLoginSession(req, user.id);

        req.loginHistoryId = loginSession.id; // Assign login history ID to the extended Request object

        const accessToken = signToken({
            id: user.id,
            role: user.role,
            login_history_id: loginSession.id,
        });

        const refreshToken = signRefreshToken({
            id: user.id,
            role: user.role,
            login_history_id: loginSession.id,
        });

        return res.status(200).json({
            message: "Login successful",
            token: accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const resendLoginCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }

        // 2. Ensure account is active
        if (user.status !== BasicStatus.Active) {
            return res.status(403).json({ message: "Account is inactive" });
        }

        // 3. Check for existing valid token
        let tokenRecord = await VerificationToken.findOne({
            where: {
                userId: user.id,
                expiresAt: { [Op.gt]: new Date() },
            },
        });

        // 4. If no valid token → generate new one
        if (!tokenRecord) {
            const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 min

            tokenRecord = await VerificationToken.create({
                userId: user.id,
                token: code,
                expiresAt,
            });
        }

        // 5. Send the verification email
        await sendVerificationCodeEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            tokenRecord.token
        );

        return res.status(200).json({
            message: "Verification code resent",
            step: "verification_required",
        });

    } catch (error) {
        console.error("Resend login code error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }

        // Verify Refresh Token
        let decoded: JwtPayload & { id: string; role: string; login_history_id: string };
        try {
            decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET!) as any;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const user = await User.findByPk(decoded.id);
        if (!user || user.status !== BasicStatus.Active) {
            return res.status(403).json({ message: "User inactive or no longer exists" });
        }

        // Generate new access token
        const newAccessToken = signToken({
            id: user.id,
            role: user.role,
            login_history_id: decoded.login_history_id,
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            token: newAccessToken,
        });

    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
