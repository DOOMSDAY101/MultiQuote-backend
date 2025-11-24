import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { generateGravatarURL, hashPassword } from '../helpers/helper-function';

export enum BasicStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}

export const validBasicStatus = Object.values(BasicStatus);

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
}

interface UserAttributes {
    id: string;
    firstName: string;
    lastName: string;
    password?: string;
    email: string;
    phoneNumber?: string;
    img?: string;
    signature?: string;  // URL string
    status?: BasicStatus;
    role: UserRole;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare id: string;
    declare firstName: string;
    declare lastName: string;
    declare email: string;
    declare phoneNumber?: string;
    declare password: string;
    declare img?: string;
    declare signature?: string;
    declare status?: BasicStatus;
    declare role: UserRole;

    readonly createdAt!: Date;
    readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        img: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        signature: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...validBasicStatus),
            defaultValue: BasicStatus.Active,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            allowNull: false,
            defaultValue: UserRole.USER,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (!user.img && user.email) {
                    user.img = generateGravatarURL(user.email);
                }
                if (user.password) {
                    user.password = hashPassword(user.password);
                }
            },
            beforeUpdate: (user) => {
                if (user.changed('password') && user.password) {
                    user.password = hashPassword(user.password);
                }
            },
        },
    }
);

export default User;
