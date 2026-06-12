import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigType } from '@nestjs/config';
import accessJwtConfig from '~/services/auth/config/access-jwt.config';
import { AuthJwtPayload } from '~/services/auth/types/auth-jwtPayload';
import { TokenService } from '~/services/auth/token.service';

@Injectable()
export class AccessJwtStrategy extends PassportStrategy(
    Strategy,
    'access-jwt'
) {
    constructor(
        private readonly tokenService: TokenService,
        @Inject(accessJwtConfig.KEY)
        private readonly accessConfig: ConfigType<typeof accessJwtConfig>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) =>
                    req.cookies?.accessToken ||
                    (typeof req.headers.authorization === 'string'
                        ? req.headers.authorization.replace('Bearer ', '')
                        : null),
            ]),
            secretOrKey: accessConfig.secret,
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: AuthJwtPayload) {
        if (!payload?.sub) {
            throw new UnauthorizedException('Invalid access token');
        }

        const headerAuth =
            typeof req.headers.authorization === 'string'
                ? req.headers.authorization.replace('Bearer ', '')
                : null;

        const token = req.cookies?.accessToken || headerAuth;

        if (
            typeof token === 'string' &&
            (await this.tokenService.isAccessTokenBlacklisted(token))
        ) {
            throw new UnauthorizedException('Access token revoked');
        }

        return { userId: payload.sub, role: payload.role };
    }
}
