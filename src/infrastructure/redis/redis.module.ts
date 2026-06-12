import { Module, Global, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from '~/infrastructure/redis/redis.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const client = new Redis({
                    host: configService.get<string>('REDIS_HOST'),
                    port: configService.get<number>('REDIS_PORT'),
                    password: configService.get<string>('REDIS_PASSWORD'),
                    lazyConnect: true,
                });

                client.on('error', (err) => {
                    if (process.env.NODE_ENV !== 'test') {
                        console.error('[Redis error]', err.message);
                    }
                });

                return client;
            },
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule implements OnModuleDestroy {
    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

    async onModuleDestroy() {
        if (this.redisClient && this.redisClient.status !== 'end') {
            await this.redisClient.quit();
        }
    }
}
