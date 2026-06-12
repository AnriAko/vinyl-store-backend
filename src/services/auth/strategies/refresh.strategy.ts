import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { TokenService } from '../token.service';
import { AuthJwtPayload } from '~/services/auth/types/auth-jwtPayload';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh'
) {
    constructor(
        @Inject(refreshJwtConfig.KEY)
        private readonly refreshConfig: ConfigType<typeof refreshJwtConfig>,
        private readonly tokenService: TokenService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) =>
                    req.cookies?.refreshToken || req.body?.refreshToken,
            ]),
            secretOrKey: refreshConfig.secret,
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: AuthJwtPayload) {
        const refreshToken =
            req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshToken)
            throw new UnauthorizedException('Missing refresh token');

        const { userId, isValid } = await this.tokenService.verifyRefreshToken(
            refreshToken as string
        );

        if (!isValid) throw new UnauthorizedException('Invalid refresh token');

        return { userId: userId, role: payload.role };
    }
}
