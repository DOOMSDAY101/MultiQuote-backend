import { JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../../models/simple-user.model';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload & { role: UserRole };
        }
    }
}



import 'express';



declare global {

    namespace Express {

        interface Request {

            loginHistoryId?: string;

        }

    }

}
