import { describe, it, beforeEach, afterEach } from 'node:test';
import { AuthService } from '~/services/auth/auth.service';
import { TokenService } from '~/services/auth/token.service';
import { UserService } from '~/services/user/user.service';
import { UserRole } from '~/entities/user.entity';
import { expect } from '~/__tests__/test-utils/expect-util';
import { RegisterDto } from '~/services/auth/dto/register.dto';
import { LoginDto } from '~/services/auth/dto/login.dto';

describe('AuthService', () => {
    let authService: AuthService;
    let userService: UserService;
    let tokenService: TokenService;

    const mockBcryptConfig = { saltRounds: 4 };
    const users: Record<string, any> = {};

    beforeEach(() => {
        userService = {
            findByEmail: async (email: string) =>
                Object.values(users).find((u) => u.email === email) || null,
            findByEmailWithPassword: async (email: string) =>
                Object.values(users).find((u) => u.email === email) || null,
            create: async (data: any) => {
                const id = String(Object.keys(users).length + 1);
                const user = { ...data, id, avatarUrl: data.avatarUrl || null };
                users[id] = user;
                return user;
            },
            findOne: async (id: string) => users[id] || null,
        } as unknown as UserService;

        tokenService = {
            generateTokens: async (userId: string, _role: UserRole) => ({
                accessToken: `access-${userId}`,
                refreshToken: `refresh-${userId}`,
            }),
            saveRefreshToken: async () => {},
            deleteRefreshToken: async () => {},
            blacklistAccessToken: async () => {},
        } as unknown as TokenService;

        authService = new AuthService(
            userService,
            tokenService,
            mockBcryptConfig
        );
    });

    afterEach(() => {
        for (const key of Object.keys(users)) delete users[key];
    });

    it('should register a new user', async () => {
        const dto: RegisterDto = {
            email: 'a@b.com',
            password: '12345678',
            firstName: 'F',
            lastName: 'L',
        };
        const res = await authService.register(dto);
        expect(res.email).toBe(dto.email);
        expect(res.accessToken).toBe('access-1');
        expect(res.refreshToken).toBe('refresh-1');
        expect(res.role).toBe(UserRole.USER);
    });

    it('should throw if password missing on register', async () => {
        const dto: RegisterDto = {
            email: 'a@b.com',
            password: '',
            firstName: 'F',
            lastName: 'L',
        };
        let threw = false;
        try {
            await authService.register(dto);
        } catch (err: any) {
            threw = err.message === 'Password is required';
        }
        expect(threw).toBeTruthy();
    });

    it('should throw if user exists on register', async () => {
        const dto: RegisterDto = {
            email: 'a@b.com',
            password: '12345678',
            firstName: 'F',
            lastName: 'L',
        };
        await authService.register(dto);
        let threw = false;
        try {
            await authService.register(dto);
        } catch (err: any) {
            threw = err.message === 'User with this email already exists';
        }
        expect(threw).toBeTruthy();
    });

    it('should login successfully with correct credentials', async () => {
        const regDto: RegisterDto = {
            email: 'a@b.com',
            password: '12345678',
            firstName: 'F',
            lastName: 'L',
        };
        await authService.register(regDto);
        const loginDto: LoginDto = { email: 'a@b.com', password: '12345678' };
        const res = await authService.login(loginDto);
        expect(res.accessToken).toBe('access-1');
        expect(res.refreshToken).toBe('refresh-1');
    });

    it('should throw on login with wrong password', async () => {
        const regDto: RegisterDto = {
            email: 'a@b.com',
            password: '12345678',
            firstName: 'F',
            lastName: 'L',
        };
        await authService.register(regDto);
        const loginDto: LoginDto = { email: 'a@b.com', password: 'wrongpass' };
        let threw = false;
        try {
            await authService.login(loginDto);
        } catch (err: any) {
            threw = err.message === 'Bad credentials';
        }
        expect(threw).toBeTruthy();
    });

    it('should throw on login with non-existent user', async () => {
        const loginDto: LoginDto = { email: 'x@y.com', password: '12345678' };
        let threw = false;
        try {
            await authService.login(loginDto);
        } catch (err: any) {
            threw = err.message === 'Bad credentials';
        }
        expect(threw).toBeTruthy();
    });

    it('should refresh tokens', async () => {
        const regDto: RegisterDto = {
            email: 'a@b.com',
            password: '12345678',
            firstName: 'F',
            lastName: 'L',
        };
        await authService.register(regDto);
        const res = await authService.refreshTokens('1');
        expect(res.accessToken).toBe('access-1');
        expect(res.refreshToken).toBe('refresh-1');
    });

    it('should throw if user not found on refresh', async () => {
        let threw = false;
        try {
            await authService.refreshTokens('99');
        } catch (err: any) {
            threw = err.message === 'User not found';
        }
        expect(threw).toBeTruthy();
    });

    it('should sign out user', async () => {
        const spyDelete = { called: false };
        tokenService.deleteRefreshToken = async () => {
            spyDelete.called = true;
        };
        tokenService.blacklistAccessToken = async () => {};
        await authService.logout('1', 'access-1');
        expect(spyDelete.called).toBeTruthy();
    });

    it('should validate JWT user', async () => {
        const regDto: RegisterDto = {
            email: 'a@b.com',
            password: '12345678',
            firstName: 'F',
            lastName: 'L',
        };
        await authService.register(regDto);
        const payload = await authService.validateJwtUser('1');
        expect(payload.sub).toBe('1');
        expect(payload.role).toBe(UserRole.USER);
    });

    it('should throw if JWT user not found', async () => {
        let threw = false;
        try {
            await authService.validateJwtUser('99');
        } catch (err: any) {
            threw = err.message === 'User not found';
        }
        expect(threw).toBeTruthy();
    });

    it('should create Google user if not exists', async () => {
        const googleUser: RegisterDto = {
            email: 'g@h.com',
            firstName: 'G',
            lastName: 'H',
            password: '12345678',
        };
        const user = await authService.validateGoogleUser(googleUser);
        expect(user.email).toBe('g@h.com');
    });

    it('should return existing Google user', async () => {
        const regDto: RegisterDto = {
            email: 'a@b.com',
            password: '12345678',
            firstName: 'F',
            lastName: 'L',
        };
        await authService.register(regDto);
        const user = await authService.validateGoogleUser({
            email: 'a@b.com',
            firstName: 'F',
            lastName: 'L',
            password: '12345678',
        });
        expect(user.email).toBe('a@b.com');
    });
});

import { validate } from 'class-validator';

describe('LoginDto', () => {
    it('should validate a correct dto', async () => {
        const dto = new LoginDto();
        dto.email = 'user@example.com';
        dto.password = 'password123';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if email is invalid', async () => {
        const dto = new LoginDto();
        dto.email = 'invalid-email';
        dto.password = 'password123';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('email');
    });

    it('should fail if password is too short', async () => {
        const dto = new LoginDto();
        dto.email = 'user@example.com';
        dto.password = 'short';

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail if email or password is empty', async () => {
        const dto = new LoginDto();
        dto.email = '';
        dto.password = '';

        const errors = await validate(dto);
        const props = errors.map((e) => e.property);
        expect(props).toContain('email');
        expect(props).toContain('password');
    });
});
