import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = `.env.${NODE_ENV}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
    PORT: process.env.PORT,
    NODE_ENV: NODE_ENV,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BASE_URL: process.env.BASE_URL,
};
