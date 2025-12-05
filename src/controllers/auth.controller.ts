import { Request, Response } from 'express';
import User, { BasicStatus, UserRole } from '../models/user.model';
import { createLoginSession, formatPhoneNumber, generateRandomPassword, getIPDetails, hashPassword, signRefreshToken, signToken } from '../helpers/helper-function';
import { sendUserPasswordEmail, sendVerificationCodeEmail } from '../middlewares/email.middleware';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { VerificationToken } from '../models/verification-token.model';
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from '../config/env';
import { uploadToCloudinary } from '../config/cloudinary';


export const createUser = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, phoneNumber, role = UserRole.USER } = req.body;

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

        let imgUrl: string | undefined;
        let signatureUrl: string | undefined;
        const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;

        if (files?.img?.[0]) imgUrl = await uploadToCloudinary(files.img[0].buffer, '/Multiquote/users');
        if (files?.signature?.[0]) signatureUrl = await uploadToCloudinary(files.signature[0].buffer, '/Multiquote/signatures');

        // Generate password
        const plainPassword = generateRandomPassword();

        const user = await User.create({
            firstName,
            lastName,
            email,
            phoneNumber: formattedPhone,
            img: imgUrl,
            signature: signatureUrl,
            password: plainPassword,
            role,
            status: BasicStatus.Active,
        });

        // Send email
        await sendUserPasswordEmail(email, firstName, plainPassword, 'create');

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


export const editUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, phoneNumber, role, password } = req.body;

        // Find the user to update
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent editing SUPER_ADMIN unless just changing password as SUPER_ADMIN
        if (user.role === UserRole.SUPER_ADMIN && !(req.user?.role === UserRole.SUPER_ADMIN && password)) {
            return res.status(403).json({ message: 'Cannot edit SUPER_ADMIN details' });
        }

        // Check email uniqueness if updating
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) return res.status(400).json({ message: 'Email already in use' });
            user.email = email;
        }

        // Format phone number
        if (phoneNumber) {
            try {
                user.phoneNumber = formatPhoneNumber(phoneNumber);
            } catch (err) {
                return res.status(400).json({ message: (err as Error).message });
            }
        }

        // Update other fields if provided (except SUPER_ADMIN restrictions)
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (role && user.role !== UserRole.SUPER_ADMIN) user.role = role;

        // Handle file uploads
        const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;
        if (files?.img?.[0]) user.img = await uploadToCloudinary(files.img[0].buffer, '/Multiquote/users');
        if (files?.signature?.[0]) user.signature = await uploadToCloudinary(files.signature[0].buffer, '/Multiquote/signatures');

        // Update password if provided
        if (password) {
            user.password = hashPassword(password);
            // Send new password via email
            await sendUserPasswordEmail(user.email, user.firstName, password, 'update');
        }

        await user.save();

        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Edit user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        // Find the user by primary key
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent toggling SUPER_ADMIN users
        if (user.role === UserRole.SUPER_ADMIN) {
            return res.status(403).json({ message: 'Cannot change status of a SUPER_ADMIN user' });
        }

        // Toggle status
        user.status = user.status === BasicStatus.Active ? BasicStatus.Inactive : BasicStatus.Active;

        // Save changes
        await user.save();

        // Respond with updated user info
        return res.status(200).json({
            message: `User is now ${user.status}`,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        return res.status(500).json({ message: 'Something went wrong' });
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
                resendAttempts: 1,
                lastAttemptAt: new Date(),
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

// export const resendLoginCode = async (req: Request, res: Response) => {
//     try {
//         const { email } = req.body;

//         // 1. Check if user exists
//         const user = await User.findOne({ where: { email } });
//         if (!user) {
//             return res.status(400).json({ message: "Invalid email" });
//         }

//         // 2. Ensure account is active
//         if (user.status !== BasicStatus.Active) {
//             return res.status(403).json({ message: "Account is inactive" });
//         }

//         // 3. Check for existing valid token
//         let tokenRecord = await VerificationToken.findOne({
//             where: {
//                 userId: user.id,
//                 expiresAt: { [Op.gt]: new Date() },
//             },
//         });

//         // 4. If no valid token → generate new one
//         if (!tokenRecord) {
//             const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
//             const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 min

//             tokenRecord = await VerificationToken.create({
//                 userId: user.id,
//                 token: code,
//                 expiresAt,
//             });
//         }

//         // 5. Send the verification email
//         await sendVerificationCodeEmail(
//             user.email,
//             `${user.firstName} ${user.lastName}`,
//             tokenRecord.token
//         );

//         return res.status(200).json({
//             message: "Verification code resent",
//             step: "verification_required",
//         });

//     } catch (error) {
//         console.error("Resend login code error:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };
const RESEND_LIMIT = 3; // Max attempts
const TIME_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export const resendLoginCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: "Invalid email" });

        if (user.status !== BasicStatus.Active)
            return res.status(403).json({ message: "Account is inactive" });

        let tokenRecord = await VerificationToken.findOne({
            where: {
                userId: user.id,
                expiresAt: { [Op.gt]: new Date() },
            },
        });

        if (!tokenRecord) {
            // No existing code → cannot resend, ask user to log in
            return res.status(400).json({
                message: "Verification code expired. Please log in again to request a new one.",
            });
        }

        const now = new Date();

        // Check resend attempts within time window
        if (
            tokenRecord.lastAttemptAt &&
            now.getTime() - tokenRecord.lastAttemptAt.getTime() < TIME_WINDOW_MS
        ) {
            if (tokenRecord.resendAttempts >= RESEND_LIMIT) {
                return res.status(429).json({
                    message: `Too many attempts. Please wait ${Math.ceil(
                        (TIME_WINDOW_MS -
                            (now.getTime() - tokenRecord.lastAttemptAt.getTime())) /
                        60000
                    )} minutes.`,
                });
            }

            // Increase attempts
            tokenRecord.resendAttempts += 1;
        } else {
            // Reset attempts due to time expiration
            tokenRecord.resendAttempts = 1;
        }

        tokenRecord.lastAttemptAt = now;
        await tokenRecord.save();

        // Send verification email
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



export const verifyToken = async (req: Request, res: Response) => {
    try {
        // Get token from headers
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) return res.status(401).json({ message: 'No token provided' });

        // Verify token
        let decoded: any;
        try {
            decoded = jwt.verify(token, config.JWT_SECRET!);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Check if user exists and is active
        const user = await User.findByPk(decoded.id);
        if (!user || user.status !== BasicStatus.Active) {
            return res.status(403).json({ message: 'User inactive or does not exist' });
        }

        // Return user info if valid
        return res.status(200).json({
            message: 'Token valid',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Verify token error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};