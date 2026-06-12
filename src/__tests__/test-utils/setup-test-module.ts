import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '~/infrastructure/redis/redis.service';

import { UserEntity } from '~/entities/user.entity';
import { VinylEntity } from '~/entities/vinyl.entity';
import { ReviewEntity } from '~/entities/review.entity';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { mockRedisService } from '~/__tests__/test-utils/mock-redis';

export const testDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    synchronize: true,
    entities: [UserEntity, VinylEntity, ReviewEntity, PurchaseEntity],
});

interface SetupTestModuleOptions extends ModuleMetadata {}

export async function setupTestModule(
    options: SetupTestModuleOptions
): Promise<TestingModuleBuilder> {
    const builder = Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.test', '.env'],
            }),
            TypeOrmModule.forRoot({
                type: 'sqlite',
                database: ':memory:',
                entities: [
                    UserEntity,
                    VinylEntity,
                    ReviewEntity,
                    PurchaseEntity,
                ],
                synchronize: true,
            }),
            TypeOrmModule.forFeature([
                UserEntity,
                VinylEntity,
                ReviewEntity,
                PurchaseEntity,
            ]),
            ...(options.imports || []),
        ],
        providers: [...(options.providers || [])],
        controllers: options.controllers || [],
    })
        .overrideProvider(RedisService)
        .useValue(mockRedisService);

    if (!testDataSource.isInitialized) {
        await testDataSource.initialize();
        await testDataSource.query('PRAGMA foreign_keys = ON');
    }

    return builder;
}

export async function createTestingInstance<T>(
    provider: new (...args: any[]) => T
): Promise<T> {
    const builder = await setupTestModule({ providers: [provider] });
    const app = await builder.compile();
    return app.get<T>(provider);
}

export async function resetMocks() {
    if (testDataSource.isInitialized) {
        for (const entity of testDataSource.entityMetadatas) {
            const repository = testDataSource.getRepository(entity.name);
            await repository.query(`DELETE FROM ${entity.tableName}`);
        }
    }
    for (const key of Array.from(mockRedisService.keys('*'))) {
        await mockRedisService.del(key);
    }
}
