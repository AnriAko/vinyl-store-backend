import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

export default registerAs(
    'access-jwt',
    (): JwtSignOptions => ({
        secret: process.env.ACCESS_JWT_SECRET || 'default_access_secret',
        expiresIn:
            (process.env
                .ACCESS_JWT_EXPIRES_IN as JwtSignOptions['expiresIn']) || '15m',
    })
);
