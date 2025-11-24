//this file is used to associate models together.
import AuditLog from "../models/audit-log.model";
import User from "../models/user.model";
import { VerificationToken } from "../models/verification-token.model";

// Collect all models in an object
const models = {
    User,
    VerificationToken,
    AuditLog
};

// Sync associations by passing models as argument
Object.values(models).forEach((model) => {
    if (isAssociable(model)) {
        model.associate(models);
    }
});

// Type guard to check if a model has an associate method
function isAssociable<T>(
    model: any
): model is { associate: (models: T) => void } {
    return typeof model.associate === 'function';
}
