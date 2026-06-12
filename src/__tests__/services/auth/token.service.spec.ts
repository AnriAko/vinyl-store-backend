import { describe, it, beforeEach, afterEach } from 'node:test';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { TokenService } from '~/services/auth/token.service';
import { RedisService } from '~/infrastructure/redis/redis.service';
import refreshJwtConfig from '~/services/auth/config/refresh-jwt.config';
import accessJwtConfig from '~/services/auth/config/access-jwt.config';
import bcryptConfig from '~/services/auth/config/bcrypt.config';
import { UserRole } from '~/entities/user.entity';
import {
    setupTestModule,
    resetMocks,
} from '~/__tests__/test-utils/setup-test-module';
import { expect } from '~/__tests__/test-utils/expect-util';
import { mockRedisService } from '~/__tests__/test-utils/mock-redis';

describe('TokenService', () => {
    let moduleRef: TestingModule;
    let service: TokenService;
    let jwtService: JwtService;
    let redisService: RedisService;

    beforeEach(async () => {
        resetMocks();

        const builder = await setupTestModule({
            imports: [JwtModule.register({})],
            providers: [
                TokenService,
                { provide: RedisService, useValue: mockRedisService },
                {
                    provide: refreshJwtConfig.KEY,
                    useValue: { secret: 'refresh-secret', expiresIn: '7d' },
                },
                {
                    provide: accessJwtConfig.KEY,
                    useValue: { secret: 'access-secret', expiresIn: '15m' },
                },
                { provide: bcryptConfig.KEY, useValue: { saltRounds: 4 } },
            ],
        });

        moduleRef = await builder.compile();

        service = moduleRef.get(TokenService);
        jwtService = moduleRef.get(JwtService);
        redisService = moduleRef.get(RedisService);
    });

    afterEach(async () => {
        await moduleRef.close();
    });

    it('should generate valid access and refresh tokens', async () => {
        const { accessToken, refreshToken } = await service.generateTokens(
            '1',
            UserRole.USER
        );

        expect(typeof accessToken).toBe('string');
        expect(typeof refreshToken).toBe('string');

        const decoded = await jwtService.verifyAsync(accessToken, {
            secret: service['accessConfig'].secret,
        });

        expect(decoded.sub).toBe('1');
        expect(decoded.role).toBe(UserRole.USER);
    });

    it('should save hashed refresh token in Redis', async () => {
        const { refreshToken } = await service.generateTokens(
            '2',
            UserRole.USER
        );
        await service.saveRefreshToken('2', refreshToken);

        const stored: string | null = await redisService.get('refresh:user:2');
        expect(stored).toBeTruthy();
        expect(await bcrypt.compare(refreshToken, stored!)).toBeTruthy();
    });

    it('should verify refresh token correctly', async () => {
        const { refreshToken } = await service.generateTokens(
            '3',
            UserRole.USER
        );
        await service.saveRefreshToken('3', refreshToken);

        const result = await service.verifyRefreshToken(refreshToken);
        expect(result.isValid).toBeTruthy();
        expect(result.userId).toBe('3');
    });

    it('should return false if refresh token is missing in Redis', async () => {
        const { refreshToken } = await service.generateTokens(
            '4',
            UserRole.USER
        );
        const result = await service.verifyRefreshToken(refreshToken);

        expect(result.isValid).toBeFalsy();
        expect(result.userId).toBe('4');
    });

    it('should delete stored refresh token', async () => {
        const { refreshToken } = await service.generateTokens(
            '5',
            UserRole.USER
        );
        await service.saveRefreshToken('5', refreshToken);

        await service.deleteRefreshToken('5');

        const exists: boolean = await redisService.exists('refresh:user:5');
        expect(exists).toBeFalsy();
    });

    it('should blacklist access token in Redis', async () => {
        const { accessToken } = await service.generateTokens(
            '6',
            UserRole.USER
        );
        await service.blacklistAccessToken(accessToken);

        const isFound: boolean = await redisService.exists(
            `blacklist:access:${accessToken}`
        );
        expect(isFound).toBeTruthy();
    });

    it('should detect if access token is blacklisted', async () => {
        const { accessToken } = await service.generateTokens(
            '7',
            UserRole.USER
        );
        await service.blacklistAccessToken(accessToken);

        const isBlacklisted: boolean =
            await service.isAccessTokenBlacklisted(accessToken);
        expect(isBlacklisted).toBeTruthy();
    });

    it('should return false if token is invalid (catch block)', async () => {
        const originalVerify = jwtService.verifyAsync;
        jwtService.verifyAsync = async () => {
            throw new Error('invalid');
        };

        const result = await service.verifyRefreshToken('invalid-token');
        expect(result.isValid).toBeFalsy();
        expect(result.userId).toBeNull();

        jwtService.verifyAsync = originalVerify;
    });

    it('should return false if payload.sub is missing', async () => {
        const fakeToken = await jwtService.signAsync(
            {},
            {
                secret: service['refreshConfig'].secret,
                expiresIn: service['refreshConfig'].expiresIn,
            }
        );

        const result = await service.verifyRefreshToken(fakeToken);
        expect(result.isValid).toBeFalsy();
        expect(result.userId).toBeNull();
    });
});
