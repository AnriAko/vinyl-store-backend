import { describe, it, beforeEach, afterEach } from 'node:test';
import request from 'supertest';
import {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { VinylController } from '~/services/vinyl/vinyl.controller';
import { VinylService } from '~/services/vinyl/vinyl.service';
import { resetMocks } from '~/__tests__/test-utils/setup-test-module';

import { CreateVinylDto } from '~/services/vinyl/dto/create-vinyl.dto';
import {
    PublicVinylViewResponseDto,
    PublicVinylPaginationResponseDto,
} from '~/services/vinyl/dto/public-vinyl-view-response.dto';

class MockRolesGuard implements CanActivate {
    canActivate(_ctx: ExecutionContext) {
        return true;
    }
}
class MockAuthGuard implements CanActivate {
    canActivate(_ctx: ExecutionContext) {
        return true;
    }
}

const mockVinylService = {
    create: async (dto) => ({ id: '1', ...dto }),
    update: async (id, dto) => ({ id, ...dto }),
    remove: async (_id) => undefined,
    findAllPublic: async (page, limit) => ({
        total: 1,
        page,
        limit,
        data: [
            { id: '1', name: 'Test Vinyl', authorName: 'Author', price: 100 },
        ],
    }),
    searchAndSort: async (_q, _sortBy, _order) => [
        { id: '1', name: 'Test Vinyl', authorName: 'Author', price: 100 },
    ],
};

describe('VinylController (E2E)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        resetMocks();

        const moduleRef = await Test.createTestingModule({
            controllers: [VinylController],
            providers: [
                { provide: VinylService, useValue: mockVinylService },
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

    it('POST /vinyl -> create vinyl', async () => {
        const dto = { name: 'New Vinyl', authorName: 'Author', price: 150 };
        const res = await request(app.getHttpServer())
            .post('/vinyl')
            .send(dto)
            .expect(201);
        if (res.body.id !== '1') throw new Error('Vinyl not created');
    });

    it('PATCH /vinyl/:id -> update vinyl', async () => {
        const dto = { name: 'Updated Vinyl', price: 200 };
        const res = await request(app.getHttpServer())
            .patch('/vinyl/1')
            .send(dto)
            .expect(200);
        if (res.body.name !== 'Updated Vinyl')
            throw new Error('Vinyl not updated');
    });

    it('DELETE /vinyl/:id -> remove vinyl', async () => {
        await request(app.getHttpServer()).delete('/vinyl/1').expect(204);
    });

    it('GET /vinyl -> public vinyl list with explicit page & limit', async () => {
        const res = await request(app.getHttpServer())
            .get('/vinyl')
            .query({ page: 1, limit: 10 })
            .expect(200);
        if (!Array.isArray(res.body.data))
            throw new Error('Invalid response data');
        if (res.body.page !== 1) throw new Error('Page query param failed');
        if (res.body.limit !== 10) throw new Error('Limit query param failed');
    });

    it('GET /vinyl -> public vinyl list with default page & limit', async () => {
        const res = await request(app.getHttpServer())
            .get('/vinyl')
            .expect(200);
        if (!Array.isArray(res.body.data))
            throw new Error('Invalid response data');
        if (res.body.page !== 1) throw new Error('Default page failed');
        if (res.body.limit !== 10) throw new Error('Default limit failed');
    });

    it('GET /vinyl/search -> search vinyls with all query params', async () => {
        const res = await request(app.getHttpServer())
            .get('/vinyl/search')
            .query({ q: 'Test', sortBy: 'price', order: 'ASC' })
            .expect(200);
        if (res.body[0].name !== 'Test Vinyl') throw new Error('Search failed');
    });

    it('GET /vinyl/search -> search vinyls with default order', async () => {
        const res = await request(app.getHttpServer())
            .get('/vinyl/search')
            .query({ q: 'Test', sortBy: 'name' })
            .expect(200);
        if (res.body[0].name !== 'Test Vinyl')
            throw new Error('Search with default order failed');
    });
});

describe('DTOs', () => {
    it('CreateVinylDto should validate correctly with all fields', async () => {
        const dto = plainToInstance(CreateVinylDto, {
            name: 'Abbey Road',
            authorName: 'The Beatles',
            description: 'Classic album',
            price: 29.99,
            currency: 'USD',
        });
        const errors = await validate(dto);
        if (errors.length > 0)
            throw new Error('CreateVinylDto validation failed');
    });

    it('CreateVinylDto optional fields can be omitted', async () => {
        const dto = plainToInstance(CreateVinylDto, {
            name: 'Revolver',
            authorName: 'The Beatles',
            price: 19.99,
        });
        const errors = await validate(dto);
        if (errors.length > 0)
            throw new Error('CreateVinylDto optional fields validation failed');
    });

    it('PublicVinylViewResponseDto should instantiate correctly', () => {
        const dto = plainToInstance(PublicVinylViewResponseDto, {
            id: '1',
            name: 'Abbey Road',
            authorName: 'The Beatles',
            description: 'Classic album',
            price: 29.99,
            currency: 'USD',
            averageScore: 4.8,
            firstReview: {
                comment: 'Amazing!',
                score: 5,
                user: {
                    id: 'u1',
                    firstName: 'John',
                    lastName: 'Lennon',
                },
            },
        });

        if (dto.id !== '1')
            throw new Error('PublicVinylViewResponseDto id failed');
        if (dto.averageScore !== 4.8)
            throw new Error('PublicVinylViewResponseDto averageScore failed');
        if (!dto.firstReview)
            throw new Error('PublicVinylViewResponseDto firstReview missing');
        if (dto.firstReview.user?.firstName !== 'John')
            throw new Error(
                'PublicVinylViewResponseDto firstReview.user failed'
            );
    });

    it('PublicVinylPaginationResponseDto should instantiate correctly', () => {
        const dto = plainToInstance(PublicVinylPaginationResponseDto, {
            total: 2,
            page: 1,
            limit: 10,
            data: [
                {
                    id: '1',
                    name: 'Vinyl1',
                    authorName: 'Author1',
                    price: 10,
                    averageScore: 4.5,
                },
                {
                    id: '2',
                    name: 'Vinyl2',
                    authorName: 'Author2',
                    price: 20,
                    averageScore: 4.0,
                },
            ],
        });

        if (dto.total !== 2)
            throw new Error('PublicVinylPaginationResponseDto total failed');
        if (dto.page !== 1)
            throw new Error('PublicVinylPaginationResponseDto page failed');
        if (dto.limit !== 10)
            throw new Error('PublicVinylPaginationResponseDto limit failed');
        if (dto.data.length !== 2)
            throw new Error(
                'PublicVinylPaginationResponseDto data length failed'
            );
        if (dto.data[0].name !== 'Vinyl1')
            throw new Error(
                'PublicVinylPaginationResponseDto first item name failed'
            );
        if (dto.data[1].averageScore !== 4.0)
            throw new Error(
                'PublicVinylPaginationResponseDto second item score failed'
            );
    });
});
