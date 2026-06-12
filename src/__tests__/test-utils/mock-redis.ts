import { RedisService } from '~/infrastructure/redis/redis.service';

const memoryStore = new Map<string, string>();

export const mockRedisService: Record<
    keyof RedisService,
    (...args: any[]) => any
> = {
    async set(key: string, value: string) {
        memoryStore.set(key, value);
        return 'OK';
    },
    async get(key: string) {
        return memoryStore.get(key) ?? null;
    },
    async del(key: string) {
        return memoryStore.delete(key) ? 1 : 0;
    },
    async exists(key: string) {
        return memoryStore.has(key) ? 1 : 0;
    },
    async keys(pattern: string) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(memoryStore.keys()).filter((k) => regex.test(k));
    },
};
