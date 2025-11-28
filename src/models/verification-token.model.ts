import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../config/database";
import User from "./user.model";

interface VerificationTokenAttributes {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    resendAttempts: number;
    lastAttemptAt: Date;
}

interface VerificationTokenCreationAttributes
    extends Optional<VerificationTokenAttributes, "id"> { }

class VerificationToken
    extends Model<
        VerificationTokenAttributes,
        VerificationTokenCreationAttributes
    >
    implements VerificationTokenAttributes {
    declare id: string;
    declare userId: string;
    declare token: string;
    declare expiresAt: Date;
    declare resendAttempts: number;
    declare lastAttemptAt: Date;

    readonly createdAt!: Date;
    readonly updatedAt!: Date;

    static associate(models: any) {
        VerificationToken.belongsTo(User, { foreignKey: "userId", as: "user" });
        User.hasMany(VerificationToken, { foreignKey: "userId", as: "tokens" });
    }

}

VerificationToken.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
        },
        token: {
            type: DataTypes.STRING(6),
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        resendAttempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        lastAttemptAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "verification_tokens",
        modelName: "VerificationToken",
        timestamps: true,
    }
);

export { VerificationToken };
