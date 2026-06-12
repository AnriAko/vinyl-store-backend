import { UserRole } from '~/entities/user.entity';

export type AuthJwtPayload = {
    sub: string;
    role: UserRole;
    exp?: number;
};
