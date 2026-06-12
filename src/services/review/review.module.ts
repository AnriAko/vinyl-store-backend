import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from '~/entities/review.entity';
import { UserEntity } from '~/entities/user.entity';
import { VinylEntity } from '~/entities/vinyl.entity';
import { ReviewController } from '~/services/review/review.controller';
import { ReviewService } from '~/services/review/review.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReviewEntity, UserEntity, VinylEntity]),
    ],
    controllers: [ReviewController],
    providers: [ReviewService],
    exports: [ReviewService],
})
export class ReviewModule {}
