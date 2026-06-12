import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class UserPreviewDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: '9d3b4a12-7c55-4b6a-89b7-5d8f739a2b3c',
    })
    id: string;

    @ApiProperty({
        description: 'First name of the user',
        example: 'John',
    })
    firstName: string;

    @ApiProperty({
        description: 'Last name of the user',
        example: 'Lennon',
    })
    lastName: string;
}

class ReviewPreviewDto {
    @ApiProperty({
        description: 'Review comment text',
        example: 'Amazing sound quality and classic design.',
        nullable: true,
    })
    comment?: string | null;

    @ApiProperty({
        description: 'Review score from 1 to 5',
        example: 5,
        nullable: true,
    })
    score?: number | null;

    @ApiProperty({
        description: 'User who left the review',
        type: () => UserPreviewDto,
        nullable: true,
    })
    @Type(() => UserPreviewDto)
    user?: UserPreviewDto | null;
}

export class PublicVinylViewResponseDto {
    @ApiProperty({
        description: 'Unique identifier of the vinyl record',
        example: 'd2b4f7e8-3b1c-4c52-b8b2-9f43c5b74b9d',
    })
    id: string;

    @ApiProperty({
        description: 'Name of the vinyl record',
        example: 'Abbey Road',
    })
    name: string;

    @ApiProperty({
        description: 'Name of the artist or band',
        example: 'The Beatles',
    })
    authorName: string;

    @ApiProperty({
        description: 'Short description of the vinyl record',
        example:
            'A classic 1969 album featuring “Come Together” and “Here Comes the Sun.”',
    })
    description?: string;

    @ApiProperty({
        description: 'Price of the vinyl record',
        example: 29.99,
    })
    price: number;

    @ApiProperty({
        description: 'Currency of the price',
        example: 'USD',
    })
    currency?: string;

    @ApiProperty({
        description: 'Average score based on user reviews',
        example: 4.8,
    })
    averageScore: number;

    @ApiProperty({
        description: 'The first available review for this vinyl (if any)',
        type: () => ReviewPreviewDto,
        nullable: true,
    })
    @Type(() => ReviewPreviewDto)
    firstReview?: ReviewPreviewDto | null;
}

export class PublicVinylPaginationResponseDto {
    @ApiProperty({
        description: 'Total number of vinyl records available',
        example: 125,
    })
    total: number;

    @ApiProperty({
        description: 'Current page number',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'Number of items per page',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'List of vinyl records on the current page',
        type: () => [PublicVinylViewResponseDto],
    })
    @Type(() => PublicVinylViewResponseDto)
    data: PublicVinylViewResponseDto[];
}
