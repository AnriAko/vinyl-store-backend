import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '~/entities/review.entity';
import { UserEntity } from '~/entities/user.entity';
import { VinylEntity } from '~/entities/vinyl.entity';
import { validatePagination } from '~/utils/validate-pagination';

interface LightUser {
    id: string;
    firstName: string;
    lastName: string;
}

export type ReviewWithLightUser = Omit<ReviewEntity, 'user'> & {
    user: LightUser | null;
};

interface ReviewCreateParams {
    userId: string;
    vinylId: string;
    comment?: string;
    score: number;
}

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(ReviewEntity)
        private readonly reviewRepository: Repository<ReviewEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(VinylEntity)
        private readonly vinylRepository: Repository<VinylEntity>
    ) {}

    private async recalculateAverageScore(vinylId: string): Promise<void> {
        const result = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.score)', 'avg')
            .where('review.vinylId = :vinylId', { vinylId })
            .getRawOne<{ avg: string | null }>();

        const avg = result?.avg ? parseFloat(result.avg) : 0;
        await this.vinylRepository.update(vinylId, { averageScore: avg });
    }

    async create(params: ReviewCreateParams): Promise<ReviewWithLightUser> {
        const { userId, vinylId, comment, score } = params;

        const existing = await this.reviewRepository.findOne({
            where: { userId, vinylId },
        });

        if (existing) {
            throw new ConflictException('You have already reviewed this vinyl');
        }

        const [user, vinyl] = await Promise.all([
            this.userRepository.findOne({
                where: { id: userId },
                select: ['id', 'firstName', 'lastName'],
            }),
            this.vinylRepository.findOne({ where: { id: vinylId } }),
        ]);

        if (!user || !vinyl) {
            throw new NotFoundException('User or Vinyl not found');
        }

        const review = this.reviewRepository.create({
            user,
            vinyl,
            userId,
            vinylId,
            comment,
            score,
        });

        const saved = await this.reviewRepository.save(review);
        await this.recalculateAverageScore(vinylId);

        return {
            ...saved,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }

    async findAllByVinyl(
        vinylId: string,
        page = 1,
        limit = 10
    ): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ReviewWithLightUser[];
    }> {
        const { parsedPage, parsedLimit } = validatePagination(page, limit);

        const [reviews, total] = await this.reviewRepository.findAndCount({
            where: { vinylId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (parsedPage - 1) * parsedLimit,
            take: parsedLimit,
        });

        const data = reviews.map<ReviewWithLightUser>((r) => ({
            ...r,
            user: r.user
                ? {
                      id: r.user.id,
                      firstName: r.user.firstName,
                      lastName: r.user.lastName,
                  }
                : null,
        }));

        return {
            total,
            page: parsedPage,
            limit: parsedLimit,
            data,
        };
    }

    async removeByAdmin(userId: string, vinylId: string): Promise<void> {
        const review = await this.reviewRepository.findOne({
            where: { userId, vinylId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        await this.reviewRepository.remove(review);
        await this.recalculateAverageScore(vinylId);
    }
}
