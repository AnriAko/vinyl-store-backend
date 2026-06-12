import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json, raw } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AllExceptionsFilter } from '~/common/filters/all-exceptions.filter';
import { AppModule } from '~/app.module';
import { LoggerMiddleware } from '~/common/middlewares/logger.middleware';
import { setupSwagger } from '~/utils/swagger-config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    setupSwagger(app);

    app.use(cookieParser());
    app.use(new LoggerMiddleware().use);

    app.use(helmet());

    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: 'Too many requests, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        })
    );

    app.setGlobalPrefix('api');

    app.use('/api/stripe/webhook', raw({ type: '*/*' }));

    app.use(json());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: false,
        })
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    const PORT = configService.get<number>('PORT') || 3000;
    const HOSTNAME = configService.get<string>('HOSTNAME') || '127.0.0.1';

    await app.listen(PORT, HOSTNAME);
    console.info(`Server running at http://${HOSTNAME}:${PORT}/`);
}

void bootstrap();
