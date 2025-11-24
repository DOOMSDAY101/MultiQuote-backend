import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mainRouter from './routes/index';
import { config } from './config/env';
import { sequelize } from './config/database';
import session from 'express-session';
import './utils/associations'
import { ensureInitialAdmins } from './helpers/initialize-data';



const app = express();

app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up the session middleware
app.use(
    session({
        secret: config.COOKIE_KEY,
        resave: false,
        saveUninitialized: false,
    })
);
// Sync sequelize
sequelize
    .sync({ alter: true })
    .then(async () => {
        console.log('Database synced successfully');
        await ensureInitialAdmins();
    })
    .catch((err) => {
        console.log(err);
    });

app.use(morgan('dev'));

app.use('/api/v1', mainRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
