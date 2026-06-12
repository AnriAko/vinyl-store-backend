import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    IsUrl,
    MinLength,
    IsDateString,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ example: '1995-05-20' })
    @IsOptional()
    @IsDateString()
    birthDate?: Date;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
    @IsOptional()
    @IsUrl()
    avatarUrl?: string;
}
