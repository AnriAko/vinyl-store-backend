import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VinylEntity } from '~/entities/vinyl.entity';
import { TelegramService } from '~/services/telegram/telegram.service';
import { CreateVinylDto } from '~/services/vinyl/dto/create-vinyl.dto';
import { UpdateVinylDto } from '~/services/vinyl/dto/update-vinyl.dto';
import { validatePagination } from '~/utils/validate-pagination';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VinylService {
    constructor(
        @InjectRepository(VinylEntity)
        private readonly vinylRepo: Repository<VinylEntity>,
        private readonly telegramService: TelegramService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    async create(dto: CreateVinylDto): Promise<VinylEntity> {
        const vinyl = this.vinylRepo.create({
            ...dto,
            currency: dto.currency?.toLowerCase() || 'usd',
        });

        await this.vinylRepo.save(vinyl);

        this.eventEmitter.emit('vinyl.created', {
            id: vinyl.id,
            name: vinyl.name,
            author: vinyl.authorName,
            price: vinyl.price,
        });

        return vinyl;
    }

    async findAll(): Promise<VinylEntity[]> {
        return this.vinylRepo.find({
            relations: ['reviews'],
        });
    }

    async findOneDetailed(id: string): Promise<VinylEntity> {
        const vinyl = await this.vinylRepo.findOne({
            where: { id },
            relations: ['reviews'],
        });
        if (!vinyl)
            throw new NotFoundException(`Vinyl with ID ${id} not found`);
        return vinyl;
    }
    async findOne(id: string): Promise<VinylEntity> {
        const vinyl = await this.vinylRepo.findOne({
            where: { id },
            relations: ['reviews'],
        });
        if (!vinyl)
            throw new NotFoundException(`Vinyl with ID ${id} not found`);
        return vinyl;
    }

    async update(id: string, dto: UpdateVinylDto): Promise<VinylEntity> {
        const vinyl = await this.findOneDetailed(id);
        Object.assign(vinyl, dto);
        if (dto.currency) vinyl.currency = dto.currency.toLowerCase();
        return this.vinylRepo.save(vinyl);
    }

    async remove(id: string): Promise<void> {
        const vinyl = await this.findOneDetailed(id);
        await this.vinylRepo.remove(vinyl);
    }

    async findAllPublic(page: number, limit: number) {
        const { parsedPage, parsedLimit } = validatePagination(page, limit);

        const qb = this.vinylRepo
            .createQueryBuilder('vinyl')
            .leftJoin(
                (subQb) =>
                    subQb
                        .select('r.vinylId', 'vinylId')
                        .addSelect('r.comment', 'comment')
                        .addSelect('r.score', 'score')
                        .addSelect('r.userId', 'userId')
                        .addSelect('r.createdAt', 'createdAt')
                        .from('reviews', 'r')
                        .where(
                            'r.createdAt = (SELECT MIN(r2.createdAt) FROM reviews r2 WHERE r2.vinylId = r.vinylId)'
                        ),
                'first_review',
                'first_review.vinylId = vinyl.id'
            )
            .leftJoin('users', 'user', 'user.id = first_review.userId')
            .addSelect([
                'vinyl.id AS id',
                'vinyl.name AS name',
                'vinyl.authorName AS authorName',
                'vinyl.description AS description',
                'vinyl.price AS price',
                'vinyl.currency AS currency',
                'vinyl.averageScore AS averageScore',
                'vinyl.imageUrl AS imageUrl',
                'vinyl.discogsReleaseId AS discogsReleaseId',
                'vinyl.discogsScore AS discogsScore',
                'first_review.comment AS firstReviewComment',
                'first_review.score AS firstReviewScore',
                'user.id AS firstReviewUserId',
                'user.firstName AS firstReviewUserFirstName',
                'user.lastName AS firstReviewUserLastName',
            ])
            .orderBy('vinyl.name', 'ASC')
            .offset((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);

        const [rows, total] = await Promise.all([
            qb.getRawMany(),
            this.vinylRepo.count(),
        ]);

        const data = rows.map((row) => ({
            id: row.id,
            name: row.name,
            authorName: row.authorName,
            description: row.description,
            price: Number(row.price),
            currency: row.currency,
            averageScore: Number(row.averageScore) || 0,
            imageUrl: row.imageUrl || null,
            discogsReleaseId: row.discogsReleaseId || null,
            discogsScore: Number(row.discogsScore) || null,
            firstReview:
                row.firstReviewComment || row.firstReviewScore
                    ? {
                          comment: row.firstReviewComment,
                          score: Number(row.firstReviewScore),
                          user: {
                              id: row.firstReviewUserId,
                              firstName: row.firstReviewUserFirstName,
                              lastName: row.firstReviewUserLastName,
                          },
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

    async searchAndSort(
        query?: string,
        sortBy?: 'price' | 'name' | 'authorName',
        order: 'ASC' | 'DESC' = 'ASC'
    ): Promise<VinylEntity[]> {
        const qb = this.vinylRepo.createQueryBuilder('vinyl');

        if (query) {
            qb.where('vinyl.name LIKE :q OR vinyl.authorName LIKE :q', {
                q: `%${query}%`,
            });
        }

        if (sortBy) {
            qb.orderBy(`vinyl.${sortBy}`, order);
        }

        return qb.getMany();
    }
}
