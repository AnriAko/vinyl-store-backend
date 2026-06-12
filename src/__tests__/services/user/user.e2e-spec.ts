import { describe, it, before, after, beforeEach } from 'node:test';
import {
    INestApplication,
    CanActivate,
    ExecutionContext,
    Module,
    forwardRef,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserController } from '~/services/user/user.controller';
import { UserService } from '~/services/user/user.service';
import { UserEntity } from '~/entities/user.entity';
import { ReviewEntity } from '~/entities/review.entity';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { AuthService } from '~/services/auth/auth.service';

import {
    setupTestModule,
    resetMocks,
} from '~/__tests__/test-utils/setup-test-module';
import { createTestRequest } from '~/__tests__/test-utils/test-request';
import { expect } from '~/__tests__/test-utils/expect-util';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '~/services/auth/guards/roles/roles.guard';

import { UpdateUserDto } from '~/services/user/dto/update-user.dto';
import { UserInfoResponse } from '~/services/user/dto/user-info-response.dto';

class MockAccessJwtGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 'test-user-id', role: 'user' };
        return true;
    }
}

class MockRolesGuard implements CanActivate {
    canActivate(): boolean {
        return true;
    }
}

class MockAuthService {
    async logout() {
        return true;
    }
}

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity, ReviewEntity, PurchaseEntity]),
    ],
    controllers: [UserController],
    providers: [
        UserService,
        { provide: AuthService, useClass: MockAuthService },
    ],
})
class TestUserModule {}

describe('UserController (e2e)', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let req: ReturnType<typeof createTestRequest>;
    let userRepo: Repository<UserEntity>;

    before(async () => {
        const builder = await setupTestModule({
            imports: [forwardRef(() => TestUserModule)],
        });

        builder
            .overrideGuard(AuthGuard('access-jwt'))
            .useClass(MockAccessJwtGuard)
            .overrideGuard(RolesGuard)
            .useClass(MockRolesGuard);

        moduleRef = await builder.compile();
        app = moduleRef.createNestApplication();
        await app.init();
        req = createTestRequest(app);
        userRepo = moduleRef.get(getRepositoryToken(UserEntity));
    });

    after(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await resetMocks();
        await userRepo.clear();
        await userRepo.insert({
            id: 'test-user-id',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            birthDate: new Date('1990-01-01'),
            avatarUrl: 'https://example.com/avatar.png',
        });
    });

    it('GET /user - returns user profile (matches UserInfoResponse)', async () => {
        const res = await req
            .get('/user')
            .set('Authorization', 'Bearer test-token');
        expect(res.status).toBe(200);

        const expectedKeys = Object.keys(new UserInfoResponse());
        const responseKeys = Object.keys(res.body);
        expect(responseKeys.sort()).toStrictEqual(expectedKeys.sort());

        expect(res.body.id).toBe('test-user-id');
        expect(res.body.firstName).toBe('John');
        expect(res.body.lastName).toBe('Doe');
        expect(res.body.reviews).toStrictEqual([]);
        expect(res.body.purchases).toStrictEqual([]);
    });

    it('PATCH /user - updates user profile (using UpdateUserDto)', async () => {
        const dto: UpdateUserDto = {
            firstName: 'JaneUpdated',
            avatarUrl: 'https://cdn.example.com/avatar.png',
        };

        const res = await req
            .patch('/user')
            .set('Authorization', 'Bearer test-token')
            .send(dto);

        expect(res.status).toBe(200);

        const expectedKeys = Object.keys(new UserInfoResponse());
        expect(Object.keys(res.body).sort()).toStrictEqual(expectedKeys.sort());

        expect(res.body.firstName).toBe(dto.firstName);
        expect(res.body.avatarUrl).toBe(dto.avatarUrl);

        const updated = await userRepo.findOneBy({ id: 'test-user-id' });
        expect(updated!.firstName).toBe(dto.firstName!);
        expect(updated!.avatarUrl).toBe(dto.avatarUrl!);
    });

    it('DELETE /user - removes user', async () => {
        const res = await req
            .delete('/user')
            .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(204);

        const found = await userRepo.findOneBy({ id: 'test-user-id' });
        expect(found).toBeNull();
    });
});
