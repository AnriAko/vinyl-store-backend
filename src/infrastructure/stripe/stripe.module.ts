import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import stripeConfig from '~/infrastructure/stripe/config/stripe.config';
import { StripeService } from '~/infrastructure/stripe/stripe.service';
import { VinylPurchaseModule } from '~/services/vinyl-purchase/vinyl-purchase.module';
import { PurchaseModule } from '~/services/purchase/purchase.module';
import { StripeController } from '~/infrastructure/stripe/stripe.controller';
import { MailModule } from '~/infrastructure/mail/mail.module';
import { UserModule } from '~/services/user/user.module';

@Module({
    imports: [
        ConfigModule.forFeature(stripeConfig),
        forwardRef(() => VinylPurchaseModule),
        PurchaseModule,
        MailModule,
        UserModule,
    ],
    controllers: [StripeController],
    providers: [StripeService],
    exports: [StripeService],
})
export class StripeModule {}
