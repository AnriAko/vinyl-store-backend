import { ApiProperty } from '@nestjs/swagger';
import { ReviewEntity } from '~/entities/review.entity';
import { PurchaseEntity } from '~/entities/purchase.entity';

export class UserInfoResponse {
    @ApiProperty({ example: '6c7a6a2e-9b5f-4a73-8c5b-6a9b9e2d2b1f' })
    id: string;

    @ApiProperty({ example: 'John' })
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @ApiProperty({ example: 'some.mail@example.com' })
    email: string;

    @ApiProperty({
        example: '1990-05-15T00:00:00.000Z',
        nullable: true,
    })
    birthDate: Date | null;

    @ApiProperty({
        example: 'https://example.com/avatars/john.png',
        nullable: true,
    })
    avatarUrl: string | null;

    @ApiProperty({
        type: () => [ReviewEntity],
        description: 'List of user reviews',
    })
    reviews: ReviewEntity[];

    @ApiProperty({
        type: () => [PurchaseEntity],
        description: 'List of purchased vinyl records',
    })
    purchases: PurchaseEntity[];
}
