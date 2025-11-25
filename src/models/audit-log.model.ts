import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import LoginHistory from './login-history.model';

interface AuditLogAttributes {
    id: string;
    action: string;
    method: string;
    request_payload: string;
    response_payload: string;
    response_length?: number;
    status_code: number;
    ip_address: string;
    user_agent: string;
    user_id?: string;
    user_role: string;
    success: boolean;
    login_history_id?: string;
}

interface AuditLogCreationAttributes
    extends Optional<AuditLogAttributes, 'id'> { }

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes>
    implements AuditLogAttributes {
    declare id: string;
    declare action: string;
    declare method: string;
    declare request_payload: string;
    declare response_payload: string;
    declare response_length?: number;
    declare status_code: number;
    declare ip_address: string;
    declare user_agent: string;
    declare user_id?: string;
    declare user_role: string;
    declare success: boolean;
    declare login_history_id?: string;

    readonly createdAt!: Date;
    readonly updatedAt!: Date;



    computeResponseLength() {
        try {
            const parsed =
                typeof this.response_payload === "string"
                    ? JSON.parse(this.response_payload)
                    : this.response_payload;

            if (parsed && typeof parsed === "object" && Array.isArray(parsed.data)) {
                this.response_length = parsed.data.length;
            } else {
                this.response_length = 1; // fallback for single object
            }
        } catch {
            this.response_length = 0;
        }
    }


    static associate(models: any) {
        AuditLog.belongsTo(LoginHistory, {
            foreignKey: 'login_history_id',
            as: 'loginSession',
        });
    }
}


AuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        action: { type: DataTypes.STRING, allowNull: false },
        method: { type: DataTypes.STRING, allowNull: false },
        request_payload: { type: DataTypes.TEXT, allowNull: false },
        response_payload: { type: DataTypes.TEXT, allowNull: false },
        response_length: { type: DataTypes.INTEGER, allowNull: true },
        status_code: { type: DataTypes.INTEGER, allowNull: false },
        ip_address: { type: DataTypes.STRING, allowNull: false },
        user_agent: { type: DataTypes.STRING, allowNull: false },
        user_id: { type: DataTypes.STRING, allowNull: true },
        user_role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'unknown' },
        success: { type: DataTypes.BOOLEAN, allowNull: false },
        login_history_id: { type: DataTypes.UUID, allowNull: true },
    },
    {
        sequelize,
        modelName: 'AuditLog',
        tableName: 'audit_logs',
        timestamps: true,
    }
);

export default AuditLog;
