import { describe, it, beforeEach, afterEach } from 'node:test';
import request from 'supertest';
import {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ReviewController } from '~/services/review/review.controller';
import {
    ReviewService,
    ReviewWithLightUser,
} from '~/services/review/review.service';
import { UserRole } from '~/entities/user.entity';

class MockRolesGuard implements CanActivate {
    canActivate(_ctx: ExecutionContext) {
        return true;
    }
}
class MockAuthGuard implements CanActivate {
    canActivate(ctx: ExecutionContext) {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 'u1', role: UserRole.ADMIN };
        return true;
    }
}

const mockReviewService = {
    create: async (params) =>
        ({
            ...params,
            createdAt: new Date(),
            user: { id: params.userId, firstName: 'John', lastName: 'Doe' },
        }) as ReviewWithLightUser,
    findAllByVinyl: async (vinylId, page, limit) => ({
        total: 1,
        page,
        limit,
        data: [
            {
                userId: 'u1',
                vinylId,
                comment: 'Nice!',
                score: 5,
                createdAt: new Date(),
                user: { id: 'u1', firstName: 'John', lastName: 'Doe' },
            },
        ],
    }),
    removeByAdmin: async (_userId, _vinylId) => undefined,
};

describe('ReviewController (E2E)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [ReviewController],
            providers: [
                { provide: ReviewService, useValue: mockReviewService },
                { provide: APP_GUARD, useClass: MockRolesGuard },
                { provide: APP_GUARD, useClass: MockAuthGuard },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /review/:vinylId -> create review', async () => {
        const dto = { comment: 'Awesome vinyl', score: 5 };
        const res = await request(app.getHttpServer())
            .post('/review/v1')
            .send(dto)
            .expect(201);

        if (res.body.user.id !== 'u1')
            throw new Error('Review userId mismatch');
        if (res.body.score !== 5) throw new Error('Review score mismatch');
    });

    it('GET /review/:vinylId -> paginated reviews', async () => {
        const res = await request(app.getHttpServer())
            .get('/review/v1')
            .query({ page: 1, limit: 10 })
            .expect(200);

        if (!Array.isArray(res.body.data))
            throw new Error('Invalid reviews array');
        if (res.body.data[0].user.id !== 'u1')
            throw new Error('Review userId mismatch');
    });

    it('DELETE /review/:vinylId/:userId -> remove review', async () => {
        await request(app.getHttpServer()).delete('/review/v1/u1').expect(204);
    });
});
