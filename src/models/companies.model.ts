import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CompanyAttributes {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id'> { }

class Company extends Model<CompanyAttributes, CompanyCreationAttributes>
    implements CompanyAttributes {
    declare id: string;
    declare name: string;
    declare logo?: string;
    declare email?: string;
    declare phoneNumber?: string;
    declare address?: string;

    readonly createdAt!: Date;
    readonly updatedAt!: Date;
}

Company.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { isEmail: true },
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Company',
        tableName: 'companies',
        timestamps: true,
    }
);

export default Company;
