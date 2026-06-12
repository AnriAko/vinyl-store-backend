import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import bcrypt from 'bcrypt';

import { UserService } from '~/services/user/user.service';
import { CreateUserDto } from '~/services/user/dto/create-user.dto';
import { LoginDto } from '~/services/auth/dto/login.dto';
import { ConfigType } from '@nestjs/config';
import bcryptConfig from '~/services/auth/config/bcrypt.config';
import { UserRole } from '~/entities/user.entity';
import { TokenService } from '~/services/auth/token.service';
import { AuthJwtPayload } from '~/services/auth/types/auth-jwtPayload';

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        @Inject(bcryptConfig.KEY)
        private readonly bcryptConf: ConfigType<typeof bcryptConfig>
    ) {}

    async register(dto: CreateUserDto, userRole: UserRole = UserRole.USER) {
        if (!dto.password) {
            throw new UnauthorizedException('Password is required');
        }

        const existing = await this.userService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(
            dto.password,
            this.bcryptConf.saltRounds
        );

        const user = await this.userService.create({
            ...dto,
            password: hashedPassword,
            role: userRole,
        });

        const tokens = await this.tokenService.generateTokens(
            user.id,
            user.role
        );
        await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatarUrl,
            role: user.role,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    async login(dto: LoginDto) {
        const { email, password } = dto;

        const user = await this.userService.findByEmailWithPassword(email);
        if (!user) throw new UnauthorizedException('Bad credentials');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            throw new UnauthorizedException('Bad credentials');

        const tokens = await this.tokenService.generateTokens(
            user.id,
            user.role
        );
        await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatarUrl,
            role: user.role,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    async refreshTokens(userId: string) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new ForbiddenException('User not found');

        const tokens = await this.tokenService.generateTokens(
            user.id,
            user.role
        );
        await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    async logout(userId: string, accessToken: string) {
        try {
            await this.tokenService.deleteRefreshToken(userId);
            await this.tokenService.blacklistAccessToken(accessToken);
        } catch (error) {
            throw new Error(`Logout failed: ${(error as Error).message}`);
        }
    }

    async validateJwtUser(userId: string): Promise<AuthJwtPayload> {
        const user = await this.userService.findOne(userId);
        if (!user) throw new UnauthorizedException('User not found');
        return { sub: user.id, role: user.role };
    }

    async validateGoogleUser(
        googleUser: CreateUserDto,
        userRole: UserRole = UserRole.USER
    ) {
        const existingUser = await this.userService.findByEmail(
            googleUser.email
        );

        if (existingUser) {
            return existingUser;
        }

        return this.userService.create({
            ...googleUser,
            role: userRole,
        });
    }
}
