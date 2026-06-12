import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class CreatePurchaseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsUUID()
    vinylId: string;

    @ApiProperty({ example: 2, minimum: 1 })
    @IsInt()
    @Min(1)
    amount: number;
}
