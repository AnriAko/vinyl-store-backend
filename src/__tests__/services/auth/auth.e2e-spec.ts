import { describe, it, before, after, beforeEach } from 'node:test';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { AuthModule } from '~/services/auth/auth.module';
import {
    setupTestModule,
    resetMocks,
} from '~/__tests__/test-utils/setup-test-module';
import { expect } from '~/__tests__/test-utils/expect-util';
import { createTestRequest } from '~/__tests__/test-utils/test-request';
import { TokenService } from '~/services/auth/token.service';
import { UserRole } from '~/entities/user.entity';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let _tokenService: TokenService;

    before(async () => {
        const builder = await setupTestModule({
            imports: [AuthModule],
        });

        moduleRef = await builder.compile();

        app = moduleRef.createNestApplication();
        await app.init();

        _tokenService = moduleRef.get(TokenService);
    });

    after(async () => {
        await app.close();
        await moduleRef.close();
    });

    beforeEach(() => {
        resetMocks();
    });

    it('POST /auth/register - should register user and return user data', async () => {
        const dto = {
            email: 'user1@example.com',
            password: '123456',
            firstName: 'John',
            lastName: 'Doe',
        };

        const req = createTestRequest(app);
        const res = await req.post('/auth/register').send(dto).expect(201);

        expect(res.body.email).toBe(dto.email);
        expect(res.body.role).toBe(UserRole.USER);
        expect(res.headers.authorization).toMatch(/^Bearer /);
        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
    });

    it('POST /auth/register/admin - should register admin', async () => {
        const dto = {
            email: 'admin@example.com',
            password: '123456',
            firstName: 'Alice',
            lastName: 'Smith',
        };

        const req = createTestRequest(app);
        const res = await req
            .post('/auth/register/admin')
            .send(dto)
            .expect(201);

        expect(res.body.role).toBe(UserRole.ADMIN);
        expect(res.headers.authorization).toMatch(/^Bearer /);
        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
    });

    it('POST /auth/login - should return tokens and user data', async () => {
        const dto = {
            email: 'login@example.com',
            password: '123456',
            firstName: 'Bob',
            lastName: 'Brown',
        };

        const req = createTestRequest(app);
        await req.post('/auth/register').send(dto).expect(201);

        const res = await req
            .post('/auth/login')
            .send({ email: dto.email, password: dto.password })
            .expect(200);

        expect(res.body.email).toBe(dto.email);
        expect(res.headers.authorization).toMatch(/^Bearer /);
        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
    });

    it('POST /auth/logout - should clear refresh cookie and revoke tokens', async () => {
        const dto = {
            email: 'logout@example.com',
            password: '123456',
            firstName: 'Out',
            lastName: 'User',
        };

        const req = createTestRequest(app);
        await req.post('/auth/register').send(dto).expect(201);
        const loginRes = await req
            .post('/auth/login')
            .send({ email: dto.email, password: dto.password })
            .expect(200);

        const accessToken = loginRes.headers.authorization.split(' ')[1];

        const res = await req
            .post('/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);

        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=;/);
    });

    it('GET /auth/google/login - should redirect to Google OAuth (302)', async () => {
        const req = createTestRequest(app);
        const res = await req.get('/auth/google/login').expect(302);
        expect(res.headers.location).toMatch(/accounts\.google\.com/);
    });

    it('GET /auth/google/login/admin - should redirect to Google OAuth (302)', async () => {
        const req = createTestRequest(app);
        const res = await req.get('/auth/google/login/admin').expect(302);
        expect(res.headers.location).toMatch(/accounts\.google\.com/);
    });

    it('GET /auth/google/callback - should redirect user after OAuth', async () => {
        const req = createTestRequest(app);
        const res = await req.get('/auth/google/callback').expect(302);
        expect(res.headers.location).toBeDefined();
        expect(res.headers.location).toMatch(/auth\/success|dashboard|profile/);
    });

    it('GET /auth/google/callback/admin - should redirect admin after OAuth', async () => {
        const req = createTestRequest(app);
        const res = await req.get('/auth/google/callback/admin').expect(302);
        expect(res.headers.location).toBeDefined();
        expect(res.headers.location).toMatch(/auth\/success|dashboard|profile/);
    });
});
