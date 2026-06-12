import test from 'node:test';
import { expect } from '~/__tests__/test-utils/expect-util';
import { RedisService } from '~/infrastructure/redis/redis.service';

class MockRedis {
    store: Record<string, string> = {};

    async set(key: string, value: string) {
        this.store[key] = String(value);
    }

    async get(key: string) {
        return this.store[key] || null;
    }

    async del(key: string) {
        delete this.store[key];
    }

    async exists(key: string) {
        return this.store[key] ? 1 : 0;
    }

    async keys(pattern: string) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return Object.keys(this.store).filter((key) => regex.test(key));
    }
}

test('RedisService.set stores value without TTL', async () => {
    const mockRedis = new MockRedis();
    const service = new RedisService(mockRedis as any);

    await service.set('key1', 'value1');

    expect(await mockRedis.get('key1')).toBe('value1');
});

test('RedisService.set stores value with TTL', async () => {
    const mockRedis = new MockRedis();
    const service = new RedisService(mockRedis as any);

    await service.set('key2', 'value2', 60);

    expect(await mockRedis.get('key2')).toBe('value2');
});

test('RedisService.get returns value or null', async () => {
    const mockRedis = new MockRedis();
    const service = new RedisService(mockRedis as any);

    await mockRedis.set('key3', 'value3');
    expect(await service.get('key3')).toBe('value3');
    expect(await service.get('missing')).toBeNull();
});

test('RedisService.del removes key', async () => {
    const mockRedis = new MockRedis();
    const service = new RedisService(mockRedis as any);

    await mockRedis.set('key4', 'value4');
    await service.del('key4');
    expect(await service.get('key4')).toBeNull();
});

test('RedisService.exists returns true or false', async () => {
    const mockRedis = new MockRedis();
    const service = new RedisService(mockRedis as any);

    await mockRedis.set('key5', 'value5');
    expect(await service.exists('key5')).toBe(true);
    expect(await service.exists('missing')).toBe(false);
});

test('RedisService.keys returns matching keys', async () => {
    const mockRedis = new MockRedis();
    const service = new RedisService(mockRedis as any);

    await mockRedis.set('user:1', 'Alice');
    await mockRedis.set('user:2', 'Bob');
    await mockRedis.set('other:1', 'X');

    const keys = await service.keys('user:*');
    expect(keys).toEqual(['user:1', 'user:2']);
});
