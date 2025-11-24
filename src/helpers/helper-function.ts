import crypto from 'crypto';
import bcrypt from 'bcrypt'
import { config } from '../config/env';
import jwt, { JwtPayload } from 'jsonwebtoken';

export function generateRandomPassword(length = 12): string {
    const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}


export const generateGravatarURL = (email: string): string => {
    const trimmedEmail = email.trim().toLowerCase();
    const hash = crypto.createHash('md5').update(trimmedEmail).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};

export const hashPassword = (password: string): string => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

export const formatPhoneNumber = (phoneNumber: string): string => {
    // Ensure input is a valid numeric string (allowing a leading '+')
    if (!/^\+?\d+$/.test(phoneNumber)) {
        throw new Error(
            'Invalid phone number format. Only numeric values are allowed.'
        );
    }

    // Remove any leading '+' for consistency
    phoneNumber = phoneNumber.replace(/^\+/, '');

    // If the number starts with '0', replace it with '+234'
    if (phoneNumber.startsWith('0')) {
        phoneNumber = '+234' + phoneNumber.slice(1);
    }
    // If the number starts with '234', ensure it has '+'
    else if (phoneNumber.startsWith('234')) {
        phoneNumber = '+234' + phoneNumber.slice(3);
    }
    // For any other case, forcefully prepend '+234'
    else {
        phoneNumber = '+234' + phoneNumber;
    }

    return phoneNumber;
};

export const signToken = (payload: any): string => {
    const secret = config.JWT_SECRET;
    const expiresIn = '1h';

    if (!secret || !expiresIn) {
        throw new Error('JWT secret or expiration time not provided');
    }
    return jwt.sign(payload, secret, { expiresIn });
};

export const signRefreshToken = (payload: any): string => {
    const secret = config.JWT_SECRET;
    const expiresIn = '15d';

    if (!secret || !expiresIn) {
        throw new Error('JWT secret or expiration time not provided');
    }
    return jwt.sign(payload, secret, { expiresIn });
};