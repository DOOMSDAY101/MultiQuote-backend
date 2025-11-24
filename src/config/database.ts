// ./src/config/database.ts

import { Dialect, Sequelize } from "sequelize";
import { config } from "./env";

require("dotenv").config();

if (!config.DB_NAME || !config.DB_USER || !config.DB_PASSWORD) {
    throw new Error("Database configuration is incomplete. Please check your environment variables.");
}

export const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD, {
    host: config.DB_HOST,
    dialect: config.DIALECT as Dialect,
    logging: false,
});
