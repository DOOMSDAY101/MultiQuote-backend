import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

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

    readonly createdAt!: Date;
    readonly updatedAt!: Date;


    computeResponseLength() {
        try {
            const parsed =
                typeof this.response_payload === 'string' ? JSON.parse(this.response_payload) : this.response_payload;
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.data)) {
                this.response_length = parsed.data.length;
            }
        } catch {
            this.response_length = 0;
        }
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
        request_payload: { type: DataTypes.TEXT('long'), allowNull: false },
        response_payload: { type: DataTypes.TEXT('long'), allowNull: false },
        response_length: { type: DataTypes.INTEGER, allowNull: true },
        status_code: { type: DataTypes.INTEGER, allowNull: false },
        ip_address: { type: DataTypes.STRING, allowNull: false },
        user_agent: { type: DataTypes.STRING, allowNull: false },
        user_id: { type: DataTypes.STRING, allowNull: true },
        user_role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'unknown' },
        success: { type: DataTypes.BOOLEAN, allowNull: false },
    },
    {
        sequelize,
        modelName: 'AuditLog',
        tableName: 'audit_logs',
        timestamps: true,
    }
);

export default AuditLog;
