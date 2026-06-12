import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { RedisService } from '~/infrastructure/redis/redis.service';
import { UserRole } from '~/entities/user.entity';
import { parseTtl } from '~/services/auth/utils/parse-ttl';
import refreshJwtConfig from '~/services/auth/config/refresh-jwt.config';
import accessJwtConfig from '~/services/auth/config/access-jwt.config';
import bcryptConfig from '~/services/auth/config/bcrypt.config';
import { AuthJwtPayload } from '~/services/auth/types/auth-jwtPayload';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService,
        @Inject(refreshJwtConfig.KEY)
        private readonly refreshConfig: ConfigType<typeof refreshJwtConfig>,
        @Inject(accessJwtConfig.KEY)
        private readonly accessConfig: ConfigType<typeof accessJwtConfig>,
        @Inject(bcryptConfig.KEY)
        private readonly bcryptConf: ConfigType<typeof bcryptConfig>
    ) {}

    async generateTokens(userId: string, role: UserRole) {
        const payload: AuthJwtPayload = { sub: userId, role };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.accessConfig.secret,
            expiresIn: this.accessConfig.expiresIn,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.refreshConfig.secret,
            expiresIn: this.refreshConfig.expiresIn,
        });

        return { accessToken, refreshToken };
    }

    async saveRefreshToken(userId: string, refreshToken: string) {
        const hashed = await bcrypt.hash(
            refreshToken,
            this.bcryptConf.saltRounds
        );

        const expiresIn = this.refreshConfig.expiresIn;
        const ttl = parseTtl(String(expiresIn));

        await this.redisService.set(`refresh:user:${userId}`, hashed, ttl);
    }

    async verifyRefreshToken(
        providedToken: string
    ): Promise<{ userId: string | null; isValid: boolean }> {
        try {
            const payload = await this.jwtService.verifyAsync(providedToken, {
                secret: this.refreshConfig.secret,
            });

            const userId = payload.sub as string | undefined;
            if (!userId) return { userId: null, isValid: false };

            const stored = await this.redisService.get(
                `refresh:user:${userId}`
            );
            if (!stored) return { userId, isValid: false };

            const isMatch = await bcrypt.compare(providedToken, stored);
            return { userId, isValid: isMatch };
        } catch {
            return { userId: null, isValid: false };
        }
    }

    async deleteRefreshToken(userId: string) {
        await this.redisService.del(`refresh:user:${userId}`);
    }
    async blacklistAccessToken(token: string) {
        const ttl = parseTtl(String(this.accessConfig.expiresIn));
        await this.redisService.set(`blacklist:access:${token}`, '1', ttl);
    }

    async isAccessTokenBlacklisted(token: string): Promise<boolean> {
        return this.redisService.exists(`blacklist:access:${token}`);
    }
}
