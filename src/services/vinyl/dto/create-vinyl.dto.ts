import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    MaxLength,
    Matches,
    IsUrl,
} from 'class-validator';

export class CreateVinylDto {
    @ApiProperty({
        description: 'Name of the vinyl record',
        example: 'Abbey Road',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Name of the vinyl’s author or band',
        example: 'The Beatles',
    })
    @IsString()
    @IsNotEmpty()
    authorName: string;

    @ApiProperty({
        description: 'Short description of the vinyl record',
        example: 'The eleventh studio album by The Beatles, released in 1969.',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description:
            'Price of the vinyl record (supports up to 2 decimal places)',
        example: 29.99,
        minimum: 0,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;

    @ApiProperty({
        description: 'Currency of the price (letters only)',
        example: 'USD',
        maxLength: 10,
        required: false,
    })
    @IsString()
    @MaxLength(10)
    @Matches(/^[A-Za-z]+$/, {
        message: 'Currency must contain only letters',
    })
    @IsOptional()
    currency?: string;

    @ApiProperty({
        description: 'URL of the vinyl image (from Discogs or manual upload)',
        example: 'https://img.discogs.com/some-image.jpg',
        required: false,
    })
    @IsOptional()
    @IsUrl({}, { message: 'Image URL must be a valid URL' })
    imageUrl?: string;

    @ApiProperty({
        description: 'Discogs release ID (if imported from Discogs)',
        example: 249504,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    discogsReleaseId?: number;

    @ApiProperty({
        description:
            'Average user score for this vinyl (calculated from reviews)',
        example: 4.5,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    averageScore?: number;

    @ApiProperty({
        description: 'Average rating from Discogs community (if available)',
        example: 4.2,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    discogsScore?: number;
}
