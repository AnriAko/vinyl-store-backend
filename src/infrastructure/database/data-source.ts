import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserEntity } from '~/entities/user.entity';
import { VinylEntity } from '~/entities/vinyl.entity';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { ReviewEntity } from '~/entities/review.entity';

config();

export const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [UserEntity, VinylEntity, PurchaseEntity, ReviewEntity],
    migrations: ['src/infrastructure/migrations/*.ts'],
    synchronize: false,
    logging: false,
});
