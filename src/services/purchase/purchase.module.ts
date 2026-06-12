import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { VinylEntity } from '~/entities/vinyl.entity';
import { RedisService } from '~/infrastructure/redis/redis.service';
import { PurchaseService } from '~/services/purchase/purchase.service';
import { VinylService } from '~/services/vinyl/vinyl.service';
import { UserModule } from '~/services/user/user.module';
import { TelegramModule } from '~/services/telegram/telegram.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PurchaseEntity, VinylEntity]),
        forwardRef(() => UserModule),
        TelegramModule,
    ],
    providers: [PurchaseService, RedisService, VinylService],
    exports: [PurchaseService],
})
export class PurchaseModule {}
