import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, Module, forwardRef } from '@nestjs/common';

import { UserService } from '~/services/user/user.service';
import { AuthService } from '~/services/auth/auth.service';
import { UserEntity } from '~/entities/user.entity';
import { ReviewEntity } from '~/entities/review.entity';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { CreateUserDto } from '~/services/user/dto/create-user.dto';
import { UpdateUserDto } from '~/services/user/dto/update-user.dto';
import {
    setupTestModule,
    resetMocks,
    testDataSource,
} from '~/__tests__/test-utils/setup-test-module';

class MockAuthService {
    async logout(): Promise<void> {}
}

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity, ReviewEntity, PurchaseEntity]),
    ],
    providers: [
        UserService,
        { provide: AuthService, useClass: MockAuthService },
    ],
    exports: [UserService],
})
class TestUserModule {}

describe('UserService (integration)', () => {
    let moduleRef: TestingModule;
    let service: UserService;
    let repo: Repository<UserEntity>;

    before(async () => {
        const builder = await setupTestModule({
            imports: [forwardRef(() => TestUserModule)],
        });
        moduleRef = await builder.compile();
        service = moduleRef.get(UserService);
        repo = moduleRef.get(getRepositoryToken(UserEntity));
    });

    after(async () => {
        if (testDataSource.isInitialized) {
            await testDataSource.destroy();
        }
    });

    beforeEach(async () => {
        await resetMocks();
        await repo.clear();
        await repo.insert({
            id: 'u1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            birthDate: new Date('1990-01-01'),
            avatarUrl: 'https://example.com/avatar.png',
            password: 'hashed',
        });
    });

    it('should create a new user', async () => {
        const dto: CreateUserDto = {
            email: 'a@b.com',
            firstName: 'Alice',
            lastName: 'Smith',
            password: '123',
        } as any;

        const result = await service.create(dto);
        assert.ok(result.id);
        assert.equal(result.email, dto.email);

        const found = await repo.findOneBy({ id: result.id });
        assert.ok(found);
    });

    it('should find user by id', async () => {
        const found = await service.findOne('u1');
        assert.ok(found);
        assert.equal(found!.email, 'john@example.com');
    });

    it('should find user by email', async () => {
        const found = await service.findByEmail('john@example.com');
        assert.ok(found);
        assert.equal(found!.id, 'u1');
    });

    it('should find user by email with password', async () => {
        const user = await service.findByEmailWithPassword('john@example.com');
        assert.ok(user);
        assert.equal(user!.email, 'john@example.com');
    });

    it('should return detailed user info', async () => {
        const res = await service.findOneDetailed('u1');
        assert.equal(res.id, 'u1');
        assert.equal(res.firstName, 'John');
    });

    it('should throw NotFoundException if user not found (detailed)', async () => {
        await assert.rejects(
            service.findOneDetailed('not-found'),
            NotFoundException
        );
    });

    it('should update user info', async () => {
        const dto: UpdateUserDto = {
            firstName: 'JaneUpdated',
            avatarUrl: 'https://cdn.example.com/avatar.png',
        };

        const res = await service.update('u1', dto);
        assert.equal(res.firstName, dto.firstName);
        assert.equal(res.avatarUrl, dto.avatarUrl);

        const updated = await repo.findOneBy({ id: 'u1' });
        assert.equal(updated!.firstName, dto.firstName);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
        await assert.rejects(service.update('bad', {}), NotFoundException);
    });

    it('should delete user and call logout', async () => {
        const spyLogout = moduleRef.get(AuthService) as MockAuthService;
        let logoutCalled = false;

        spyLogout.logout = async (): Promise<void> => {
            logoutCalled = true;
        };

        await service.delete('u1', 'token123');

        const found = await repo.findOneBy({ id: 'u1' });
        assert.equal(found, null);
        assert.equal(logoutCalled, true);
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
        await assert.rejects(service.delete('x', 'token'), NotFoundException);
    });
});
