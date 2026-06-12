import {
    IsEmail,
    IsOptional,
    IsString,
    IsDateString,
    IsEnum,
    IsNotEmpty,
} from 'class-validator';
import { UserRole } from '~/entities/user.entity';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsOptional()
    @IsDateString()
    birthDate?: Date;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    provider?: string;

    @IsOptional()
    @IsString()
    providerId?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
