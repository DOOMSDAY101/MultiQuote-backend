import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { config } from '../config/env';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT || '465'),
    secure: parseInt(config.SMTP_PORT || '465') === 465,
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
    logger: false, // Enable logging
    debug: false,  // Enable debugging
});

export const sendMail = async (
    to: string,
    subject: string,
    text: string,
    html?: string,

) => {
    const mailOptions = {
        from: config.SMTP_FROM_EMAIL, // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html, // HTML body (optional)
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('Preview URL: %s', previewUrl);
        }

        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};