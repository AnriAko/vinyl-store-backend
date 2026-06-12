import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { parseTtl } from '~/services/auth/utils/parse-ttl';

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    [key: string]: unknown;
}

@Injectable()
export class AuthTokenInterceptor implements NestInterceptor {
    constructor(private readonly configService: ConfigService) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler<TokenResponse>
    ): Observable<Record<string, unknown>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();

        const ttlString =
            this.configService.get<string>('refresh-jwt.expiresIn') || '7d';
        const maxAge = parseTtl(ttlString) * 1000;

        return next.handle().pipe(
            map((data) => {
                if (
                    data &&
                    typeof data === 'object' &&
                    'accessToken' in data &&
                    'refreshToken' in data
                ) {
                    response.setHeader(
                        'Authorization',
                        `Bearer ${data.accessToken}`
                    );

                    response.cookie('refreshToken', data.refreshToken, {
                        httpOnly: true,
                        sameSite: 'lax',
                        secure: false,
                        path: '/',
                        maxAge,
                    });

                    const {
                        accessToken: _accessToken,
                        refreshToken: _refreshToken,
                        ...rest
                    } = data;
                    return rest;
                }

                return data;
            })
        );
    }
}
