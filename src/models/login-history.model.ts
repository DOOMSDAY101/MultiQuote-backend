import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import AuditLog from './audit-log.model';

interface LoginHistoryAttributes {
    id: string;
    userId: string;
    ipAddress: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    browser: string | null;
    os: string | null;
    deviceType: string | null;
    userAgent: string | null;
    loginTime: Date;
    logoutTime?: Date;
}

interface LoginHistoryCreationAttributes
    extends Optional<LoginHistoryAttributes, 'id' | 'logoutTime'> { }

class LoginHistory extends Model<LoginHistoryAttributes, LoginHistoryCreationAttributes>
    implements LoginHistoryAttributes {
    declare id: string;
    declare userId: string;
    declare ipAddress: string | null;
    declare city: string | null;
    declare region: string | null;
    declare country: string | null;
    declare browser: string | null;
    declare os: string | null;
    declare deviceType: string | null;
    declare userAgent: string | null;
    declare loginTime: Date;
    declare logoutTime?: Date;


    readonly createdAt!: Date;
    readonly updatedAt!: Date;

    static associate(models: any) {
        LoginHistory.hasMany(AuditLog, {
            foreignKey: 'login_history_id',
            as: 'auditLogs',
        });
    }
}

LoginHistory.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        userId: { type: DataTypes.STRING, allowNull: false },
        ipAddress: DataTypes.STRING,
        city: DataTypes.STRING,
        region: DataTypes.STRING,
        country: DataTypes.STRING,
        browser: DataTypes.STRING,
        os: DataTypes.STRING,
        deviceType: DataTypes.STRING,
        userAgent: DataTypes.STRING,
        loginTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        logoutTime: DataTypes.DATE,
    },
    {
        sequelize,
        modelName: 'LoginHistory',
        tableName: 'login_history',
        timestamps: true,
    }
);

export default LoginHistory;
