import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

    async set(
        key: string,
        value: string | number,
        ttlSeconds?: number
    ): Promise<void> {
        if (ttlSeconds) {
            await this.redis.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.redis.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return await this.redis.get(key);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const res = await this.redis.exists(key);
        return res === 1;
    }

    async keys(pattern: string): Promise<string[]> {
        return await this.redis.keys(pattern);
    }
}
