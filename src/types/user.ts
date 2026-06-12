import { UserRole } from '~/entities/user.entity';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    provider?: string | null;
    providerId?: string | null;
    password?: string | null;
    birthDate?: Date | null;
    avatarUrl?: string | null;
}
