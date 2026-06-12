import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
    @ApiProperty({
        example: 'Excellent sound and recording quality!',
        required: false,
    })
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiProperty({ example: 5, minimum: 1, maximum: 10 })
    @IsInt()
    @Min(1)
    @Max(10)
    score: number;
}
