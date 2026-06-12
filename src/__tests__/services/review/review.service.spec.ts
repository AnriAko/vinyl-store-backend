import { describe, it, beforeEach, afterEach } from 'node:test';
import { ReviewService } from '~/services/review/review.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { expect } from '~/__tests__/test-utils/expect-util';
import { CreateReviewDto } from '~/services/review/dto/create-review.dto';
import { validate } from 'class-validator';

describe('ReviewService', () => {
    let service: ReviewService;

    const users: Record<string, any> = {};
    const vinyls: Record<string, any> = {};
    const reviews: Record<string, any> = {};

    beforeEach(() => {
        const userRepository = {
            findOne: async (opts: any) => {
                if (opts.where?.id) return users[opts.where.id] || null;
                if (opts.where?.email)
                    return (
                        Object.values(users).find(
                            (u) => u.email === opts.where.email
                        ) || null
                    );
                return null;
            },
        };

        const vinylRepository = {
            findOne: async (opts: any) => vinyls[opts.where.id] || null,
            update: async (id: string, data: any) => {
                if (vinyls[id]) vinyls[id] = { ...vinyls[id], ...data };
            },
        };

        const reviewRepository = {
            findOne: async (opts: any) => {
                const key = `${opts.where.userId}-${opts.where.vinylId}`;
                return reviews[key] || null;
            },
            create: (data: any) => data,
            save: async (data: any) => {
                const key = `${data.userId}-${data.vinylId}`;
                reviews[key] = { ...data, user: users[data.userId] };
                return reviews[key];
            },
            remove: async (review: any) => {
                const key = `${review.userId}-${review.vinylId}`;
                delete reviews[key];
            },
            findAndCount: async (opts: any) => {
                const vinylId = opts.where.vinylId;
                const data = Object.values(reviews).filter(
                    (r) => r.vinylId === vinylId
                );
                return [data, data.length];
            },
            createQueryBuilder: () => ({
                select: function () {
                    return this;
                },
                addSelect: function () {
                    return this;
                },
                where: function () {
                    return this;
                },
                getRawOne: async () => ({ avg: 5 }),
            }),
        };

        service = new ReviewService(
            reviewRepository as any,
            userRepository as any,
            vinylRepository as any
        );
    });

    afterEach(() => {
        for (const key of Object.keys(users)) delete users[key];
        for (const key of Object.keys(vinyls)) delete vinyls[key];
        for (const key of Object.keys(reviews)) delete reviews[key];
    });

    it('create: should create a review successfully', async () => {
        const user = { id: '1', firstName: 'John', lastName: 'Doe' };
        const vinyl = { id: 'v1', name: 'Vinyl 1', authorName: 'Artist' };
        users[user.id] = user;
        vinyls[vinyl.id] = vinyl;

        const review = await service.create({
            userId: user.id,
            vinylId: vinyl.id,
            score: 5,
            comment: 'Great',
        });

        expect(review.user!.id).toBe(user.id);
        expect(review.score).toBe(5);
        expect(review.comment).toBe('Great');
    });

    it('create: should throw conflict if review already exists', async () => {
        const user = { id: '1', firstName: 'John', lastName: 'Doe' };
        const vinyl = { id: 'v1', name: 'Vinyl 1', authorName: 'Artist' };
        users[user.id] = user;
        vinyls[vinyl.id] = vinyl;

        await service.create({ userId: user.id, vinylId: vinyl.id, score: 5 });

        let threw = false;
        try {
            await service.create({
                userId: user.id,
                vinylId: vinyl.id,
                score: 4,
            });
        } catch (err: any) {
            threw = err instanceof ConflictException;
        }
        expect(threw).toBeTruthy();
    });

    it('create: should throw NotFoundException if user or vinyl not found', async () => {
        let threw = false;
        try {
            await service.create({ userId: 'fake', vinylId: 'fake', score: 5 });
        } catch (err: any) {
            threw = err instanceof NotFoundException;
        }
        expect(threw).toBeTruthy();
    });

    it('findAllByVinyl: should return paginated reviews', async () => {
        const user = { id: '1', firstName: 'John', lastName: 'Doe' };
        const vinyl = { id: 'v1', name: 'Vinyl 1', authorName: 'Artist' };
        users[user.id] = user;
        vinyls[vinyl.id] = vinyl;

        await service.create({
            userId: user.id,
            vinylId: vinyl.id,
            score: 5,
            comment: 'Nice',
        });

        const res = await service.findAllByVinyl(vinyl.id, 1, 10);
        expect(res.total).toBe(1);
        expect(res.data[0].user!.id).toBe(user.id);
        expect(res.data[0].comment).toBe('Nice');
    });

    it('removeByAdmin: should remove review', async () => {
        const user = { id: '1', firstName: 'John', lastName: 'Doe' };
        const vinyl = { id: 'v1', name: 'Vinyl 1', authorName: 'Artist' };
        users[user.id] = user;
        vinyls[vinyl.id] = vinyl;

        await service.create({ userId: user.id, vinylId: vinyl.id, score: 5 });
        await service.removeByAdmin(user.id, vinyl.id);

        const review = await service.findAllByVinyl(vinyl.id, 1, 10);
        expect(review.total).toBe(0);
    });

    it('removeByAdmin: should throw NotFoundException if review missing', async () => {
        let threw = false;
        try {
            await service.removeByAdmin('fake', 'fake');
        } catch (err: any) {
            threw = err instanceof NotFoundException;
        }
        expect(threw).toBeTruthy();
    });
});
describe('CreateReviewDto', () => {
    it('should validate a correct dto', async () => {
        const dto = new CreateReviewDto();
        dto.score = 5;
        dto.comment = 'Excellent sound';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if score is below minimum', async () => {
        const dto = new CreateReviewDto();
        dto.score = 0;
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'score')).toBe(true);
    });

    it('should fail if score is above maximum', async () => {
        const dto = new CreateReviewDto();
        dto.score = 11;
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'score')).toBe(true);
    });

    it('should fail if score is missing', async () => {
        const dto = new CreateReviewDto();
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'score')).toBe(true);
    });

    it('should fail if comment is not a string', async () => {
        const dto = new CreateReviewDto();
        // @ts-expect-error checking runtime validaiton
        dto.comment = 123;
        dto.score = 5;
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'comment')).toBe(true);
    });
});
