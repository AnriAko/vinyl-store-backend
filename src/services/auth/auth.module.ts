import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { UserEntity } from '~/entities/user.entity';
import { RedisModule } from '~/infrastructure/redis/redis.module';
import { AccessJwtAuthGuard } from '~/services/auth/guards/access-jwt-auth/access-jwt.guard';
import { TokenService } from '~/services/auth/token.service';
import accessJwtConfig from '~/services/auth/config/access-jwt.config';
import refreshJwtConfig from '~/services/auth/config/refresh-jwt.config';
import googleOauthConfig from '~/services/auth/config/google-oauth.config';
import bcryptConfig from '~/services/auth/config/bcrypt.config';
import { AuthController } from '~/services/auth/auth.controller';
import { AuthService } from '~/services/auth/auth.service';
import { RefreshJwtStrategy } from '~/services/auth/strategies/refresh.strategy';
import {
    GoogleAdminStrategy,
    GoogleUserStrategy,
} from '~/services/auth/strategies/google.strategy';
import { AccessJwtStrategy } from '~/services/auth/strategies/access-jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '~/services/auth/guards/roles/roles.guard';
import { UserModule } from '~/services/user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        ConfigModule.forFeature(refreshJwtConfig),
        ConfigModule.forFeature(googleOauthConfig),
        ConfigModule.forFeature(bcryptConfig),
        ConfigModule.forFeature(accessJwtConfig),
        RedisModule,
        JwtModule.register({}),
        forwardRef(() => UserModule),
    ],
    controllers: [AuthController],
    providers: [
        TokenService,
        AuthService,
        RefreshJwtStrategy,
        GoogleAdminStrategy,
        GoogleUserStrategy,
        AccessJwtStrategy,
        {
            provide: APP_GUARD,
            useClass: AccessJwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    exports: [AuthService],
})
export class AuthModule {}
