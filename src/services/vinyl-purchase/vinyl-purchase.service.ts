import {
    Injectable,
    Inject,
    forwardRef,
    NotFoundException,
} from '@nestjs/common';
import { StripeService } from '~/infrastructure/stripe/stripe.service';
import { PurchaseService } from '~/services/purchase/purchase.service';
import { PurchaseType } from '~/entities/purchase.entity';
import { PurchaseParams } from '~/services/purchase/types/purchase-params';
import { Vinyl } from '~/types/vinyl';
import { VinylService } from '~/services/vinyl/vinyl.service';

export type VinylPurchaseMetadata = Omit<Vinyl, 'averageScore'>;

@Injectable()
export class VinylPurchaseService {
    constructor(
        @Inject(forwardRef(() => StripeService))
        private readonly stripeService: StripeService,
        private readonly vinylService: VinylService,
        private readonly purchaseService: PurchaseService
    ) {}

    async createCheckout(params: {
        userId: string;
        vinylId: string;
        amount: number;
    }) {
        const { userId, vinylId, amount } = params;

        const vinyl = await this.vinylService.findOne(vinylId);
        if (!vinyl)
            throw new NotFoundException(`Vinyl with ID ${vinylId} not found`);

        const price = Number(vinyl.price);
        const currency = vinyl.currency;

        const details: VinylPurchaseMetadata = {
            id: vinyl.id,
            name: vinyl.name,
            authorName: vinyl.authorName,
            description: vinyl.description,
            price: vinyl.price,
            currency: vinyl.currency,
        };
        const paymentIntent = await this.stripeService.createPaymentIntent({
            userId,
            purchaseType: PurchaseType.VINYL,
            price,
            amount,
            currency,
            details: JSON.stringify(details),
        });

        const purchaseData: PurchaseParams = {
            userId,
            purchaseType: PurchaseType.VINYL,
            amount,
            price,
            currency,
            details: JSON.stringify(details),
            stripePaymentIntentId: paymentIntent.id,
        };

        await this.stripeService.savePendingPurchase(
            paymentIntent.id,
            purchaseData
        );

        return { clientSecret: paymentIntent.client_secret };
    }

    async handleSucceededPayment(params: PurchaseParams) {
        const raw = await this.stripeService.getPendingPurchase(
            params.stripePaymentIntentId
        );
        if (!raw) return;

        const purchase = await this.purchaseService.createSuccessfulPurchase({
            userId: params.userId,
            purchaseType: PurchaseType.VINYL,
            amount: params.amount,
            price: params.price,
            currency: params.currency,
            details: params.details,
            stripePaymentIntentId: params.stripePaymentIntentId,
            stripeChargeId: params.stripeChargeId,
            receiptUrl: params.receiptUrl,
        });

        await this.stripeService.clearPendingPurchase(
            params.stripePaymentIntentId
        );

        return purchase;
    }

    async getAllVinylPurchasesByUser(userId: string) {
        return this.purchaseService.getByUser(userId, PurchaseType.VINYL);
    }

    async getOneVinylPurchaseById(id: string) {
        const purchase = await this.purchaseService.getById(id);
        if (!purchase || purchase.PurchaseType !== PurchaseType.VINYL) {
            throw new NotFoundException(
                `Vinyl purchase with ID ${id} not found`
            );
        }
        return purchase;
    }
}
