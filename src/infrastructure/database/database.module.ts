import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { UserEntity } from '~/entities/user.entity';
import { VinylEntity } from '~/entities/vinyl.entity';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { ReviewEntity } from '~/entities/review.entity';
import { AuditSubscriber } from '~/infrastructure/audit/audit.subscriber';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('DB_HOST'),
                port: Number(configService.get<string>('DB_PORT')),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                entities: [
                    UserEntity,
                    VinylEntity,
                    PurchaseEntity,
                    ReviewEntity,
                ],
                migrations: ['dist/migrations/*.js'],
                synchronize: false,
                logging: false,
            }),
            dataSourceFactory: async (options: DataSourceOptions) => {
                const dataSource = new DataSource(options);
                await dataSource.initialize();
                dataSource.subscribers.push(new AuditSubscriber());
                await dataSource.runMigrations();
                return dataSource;
            },
        }),
    ],
})
export class DatabaseModule implements OnModuleDestroy {
    constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

    async onModuleDestroy() {
        if (this.dataSource && this.dataSource.isInitialized) {
            await this.dataSource.destroy();
        }
    }
}
