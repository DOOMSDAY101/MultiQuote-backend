import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mainRouter from './routes/index';
import { config } from './config/env';


const app = express();

app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));

app.use('/api/v1', mainRouter);


app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
export default app;
