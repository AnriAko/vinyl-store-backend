import { Module, forwardRef } from '@nestjs/common';

import { StripeModule } from '~/infrastructure/stripe/stripe.module';
import { PurchaseModule } from '~/services/purchase/purchase.module';
import { RedisModule } from '~/infrastructure/redis/redis.module';
import { VinylModule } from '~/services/vinyl/vinyl.module';
import { VinylPurchaseController } from '~/services/vinyl-purchase/vinyl-purchase.controller';
import { VinylPurchaseService } from '~/services/vinyl-purchase/vinyl-purchase.service';

@Module({
    imports: [
        forwardRef(() => StripeModule),
        forwardRef(() => PurchaseModule),
        RedisModule,
        VinylModule,
    ],
    controllers: [VinylPurchaseController],
    providers: [VinylPurchaseService],
    exports: [VinylPurchaseService],
})
export class VinylPurchaseModule {}
