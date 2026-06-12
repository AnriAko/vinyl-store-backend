import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '~/infrastructure/audit/audit.module';
import { DatabaseModule } from '~/infrastructure/database/database.module';
import { MailModule } from '~/infrastructure/mail/mail.module';
import { RedisModule } from '~/infrastructure/redis/redis.module';
import { StripeModule } from '~/infrastructure/stripe/stripe.module';
import { AuthModule } from '~/services/auth/auth.module';
import { PurchaseModule } from '~/services/purchase/purchase.module';
import { ReviewModule } from '~/services/review/review.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from '~/services/user/user.module';
import { VinylPurchaseModule } from '~/services/vinyl-purchase/vinyl-purchase.module';
import { VinylModule } from '~/services/vinyl/vinyl.module';
import { DiscogsModule } from '~/services/discogs-module/discogs.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        DatabaseModule,
        MailModule,
        RedisModule,
        StripeModule,
        AuthModule,
        VinylModule,
        ReviewModule,
        VinylPurchaseModule,
        UserModule,
        PurchaseModule,
        AuditModule,
        DiscogsModule,
    ],
})
export class AppModule {}
