import { config } from "../config/env";
import User, { BasicStatus, UserRole } from "../models/user.model";

export async function ensureInitialAdmins() {
    try {
        const usersToCreate = [
            {
                email: config.SUPER_ADMIN_EMAIL,
                password: config.SUPER_ADMIN_PASSWORD,
                firstName: 'Super',
                lastName: 'Admin',
                role: UserRole.SUPER_ADMIN,
            },
            {
                email: config.ADMIN_EMAIL,
                password: config.ADMIN_PASSWORD,
                firstName: 'Admin',
                lastName: 'User',
                role: UserRole.ADMIN,
            },
        ].filter(user => user.email && user.password);

        for (const userData of usersToCreate) {
            const existingUser = await User.findOne({ where: { email: userData.email } });

            if (existingUser) {
                console.log(`${userData.role} already exists. Skipping creation.`);
                continue;
            }

            await User.create({
                ...userData,
                status: BasicStatus.Active,
            } as any);

            console.log(`${userData.role} created successfully.`);
        }
    } catch (error) {
        console.error('❌ Error creating initial admin users:', error);
    }
}