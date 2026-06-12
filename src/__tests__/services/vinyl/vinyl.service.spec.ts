import { describe, it, before, after, beforeEach } from 'node:test';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';
import { VinylService } from '~/services/vinyl/vinyl.service';
import { VinylEntity } from '~/entities/vinyl.entity';
import { ReviewEntity } from '~/entities/review.entity';
import { UserEntity } from '~/entities/user.entity';
import {
    setupTestModule,
    testDataSource,
    resetMocks,
} from '~/__tests__/test-utils/setup-test-module';
import { expect } from '~/__tests__/test-utils/expect-util';

describe('VinylService', () => {
    let moduleRef: TestingModule;
    let app: INestApplication;
    let service: VinylService;

    before(async () => {
        const builder = await setupTestModule({
            imports: [
                TypeOrmModule.forFeature([
                    VinylEntity,
                    ReviewEntity,
                    UserEntity,
                ]),
            ],
            providers: [VinylService],
        });

        moduleRef = await builder.compile();

        app = moduleRef.createNestApplication();
        await app.init();

        service = moduleRef.get(VinylService);
    });

    beforeEach(async () => {
        await resetMocks();
    });

    after(async () => {
        await app.close();
        await moduleRef.close();
        if (testDataSource.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it('should create a vinyl with lowercased currency', async () => {
        const created = await service.create({
            name: 'Test Vinyl',
            authorName: 'Test Author',
            description: 'Cool vinyl',
            price: 10,
            currency: 'EUR',
        });

        expect(created.currency).toBe('eur');
    });

    it('should return all vinyls with relations', async () => {
        await service.create({
            name: 'A',
            authorName: 'B',
            description: '',
            price: 1,
            currency: 'usd',
        });

        const all = await service.findAll();
        expect(Array.isArray(all)).toBeTruthy();
        expect(all.length).toBeDefined();
    });

    it('should find one vinyl by id', async () => {
        const created = await service.create({
            name: 'Find me',
            authorName: 'Author',
            description: '',
            price: 10,
            currency: 'usd',
        });

        const found = await service.findOneDetailed(created.id);
        expect(found.id).toBe(created.id);
    });

    it('should throw NotFoundException when vinyl not found', async () => {
        try {
            await service.findOneDetailed('nonexistent-id');
            throw new Error('Expected to throw');
        } catch (err: any) {
            expect(err.message).toContain(
                'Vinyl with ID nonexistent-id not found'
            );
        }
    });

    it('should update an existing vinyl', async () => {
        const created = await service.create({
            name: 'Old',
            authorName: 'Auth',
            description: '',
            price: 5,
            currency: 'usd',
        });

        const updated = await service.update(created.id, {
            name: 'New',
            currency: 'EUR',
        });

        expect(updated.name).toBe('New');
        expect(updated.currency).toBe('eur');
    });

    it('should remove an existing vinyl', async () => {
        const created = await service.create({
            name: 'To remove',
            authorName: 'Auth',
            description: '',
            price: 5,
            currency: 'usd',
        });

        await service.remove(created.id);

        try {
            await service.findOneDetailed(created.id);
            throw new Error('Expected to throw');
        } catch (err: any) {
            expect(err.message).toContain('Vinyl with ID');
        }
    });

    it('should paginate and format public vinyls', async () => {
        await service.create({
            name: 'A',
            authorName: 'B',
            description: '',
            price: 10,
            currency: 'usd',
        });

        const result = await service.findAllPublic(1, 10);
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBeTruthy();
    });

    it('should search vinyls by name or author', async () => {
        await service.create({
            name: 'Beatles Album',
            authorName: 'Beatles',
            description: '',
            price: 10,
            currency: 'usd',
        });

        const result = await service.searchAndSort('Beatles');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort vinyls by price descending', async () => {
        await service.create({
            name: 'Cheap',
            authorName: 'A',
            description: '',
            price: 5,
            currency: 'usd',
        });

        await service.create({
            name: 'Expensive',
            authorName: 'B',
            description: '',
            price: 100,
            currency: 'usd',
        });

        const result = await service.searchAndSort(undefined, 'price', 'DESC');
        expect(result[0].price).toBeGreaterThan(result[1].price);
    });
    it('should find one vinyl using findOne()', async () => {
        const created = await service.create({
            name: 'FindOne',
            authorName: 'Tester',
            description: '',
            price: 12,
            currency: 'usd',
        });

        const found = await service.findOne(created.id);
        expect(found).toBeDefined();
        expect(found.id).toBe(created.id);
    });

    it('should throw NotFoundException in findOne()', async () => {
        let errorCaught = false;
        try {
            await service.findOne('invalid-id');
        } catch (err: any) {
            errorCaught =
                err instanceof Error &&
                /Vinyl with ID invalid-id not found/.test(err.message);
        }
        expect(errorCaught).toBe(true);
    });

    it('should return firstReview data in findAllPublic()', async () => {
        const vinyl = await service.create({
            name: 'Has review',
            authorName: 'With Reviewer',
            description: '',
            price: 30,
            currency: 'usd',
        });

        const dataSource = moduleRef.get(getDataSourceToken());
        const manager = dataSource.manager;

        await manager.insert(UserEntity, {
            id: 'test-user',
            email: 'test@example.com',
            password: 'hashed',
            firstName: 'Test',
            lastName: 'User',
        });

        await manager.insert(ReviewEntity, {
            vinylId: vinyl.id,
            comment: 'Great vinyl!',
            score: 5,
            userId: 'test-user',
            createdAt: new Date(),
        });

        const result = await service.findAllPublic(1, 10);
        const reviewed = result.data.find((v) => v.id === vinyl.id);

        expect(reviewed).toBeDefined();
        expect(reviewed!.firstReview).toBeTruthy();
        expect(reviewed!.firstReview?.comment).toBe('Great vinyl!');
    });
    it('should handle findAllPublic with custom page and limit', async () => {
        const result = await service.findAllPublic(2, 1);
        expect(result).toHaveProperty('total');
        expect(result.page).toBe(2);
        expect(result.limit).toBe(1);
        expect(Array.isArray(result.data)).toBeTruthy();
    });

    it('should return empty array when searchAndSort finds nothing', async () => {
        const result = await service.searchAndSort('NonExistentQuery');
        expect(Array.isArray(result)).toBeTruthy();
        expect(result.length).toBe(0);
    });

    it('should sort vinyls by name ascending', async () => {
        const dataSource = moduleRef.get(getDataSourceToken());
        await dataSource.manager.clear(VinylEntity);

        await service.create({
            name: 'B Album',
            authorName: 'A',
            description: '',
            price: 5,
            currency: 'usd',
        });
        await service.create({
            name: 'A Album',
            authorName: 'B',
            description: '',
            price: 5,
            currency: 'usd',
        });

        const result = await service.searchAndSort(undefined, 'name', 'ASC');
        const names = result.map((v) => v.name);
        expect(names).toEqual(['A Album', 'B Album']);
    });

    it('should sort vinyls by authorName descending', async () => {
        const dataSource = moduleRef.get(getDataSourceToken());
        await dataSource.manager.clear(VinylEntity);

        await service.create({
            name: 'Album 1',
            authorName: 'A',
            description: '',
            price: 5,
            currency: 'usd',
        });
        await service.create({
            name: 'Album 2',
            authorName: 'B',
            description: '',
            price: 5,
            currency: 'usd',
        });

        const result = await service.searchAndSort(
            undefined,
            'authorName',
            'DESC'
        );
        const authors = result.map((v) => v.authorName);
        expect(authors).toEqual(['B', 'A']);
    });

    it('should throw error when updating non-existent vinyl', async () => {
        let errorCaught = false;
        try {
            await service.update('nonexistent-id', { name: 'Fail' });
        } catch (err: any) {
            errorCaught =
                err instanceof Error &&
                /Vinyl with ID nonexistent-id not found/.test(err.message);
        }
        expect(errorCaught).toBe(true);
    });

    it('should throw error when removing non-existent vinyl', async () => {
        let errorCaught = false;
        try {
            await service.remove('nonexistent-id');
        } catch (err: any) {
            errorCaught =
                err instanceof Error &&
                /Vinyl with ID nonexistent-id not found/.test(err.message);
        }
        expect(errorCaught).toBe(true);
    });
});
