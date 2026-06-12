import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsDateString,
    IsUrl,
    Length,
} from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'John', description: 'User first name' })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    lastName?: string;

    @ApiPropertyOptional({
        example: '1990-05-15',
        description: 'User birth date in ISO format',
    })
    @IsOptional()
    @IsDateString()
    birthDate?: Date;

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.jpg',
        description: 'URL of the user avatar image',
    })
    @IsOptional()
    @IsUrl()
    avatarUrl?: string;
}
