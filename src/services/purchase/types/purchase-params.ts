import { PurchaseType } from '~/entities/purchase.entity';

export interface PurchaseParams {
    userId: string;
    purchaseType: PurchaseType;
    amount: number;
    price: number;
    currency: string;
    stripePaymentIntentId: string;
    stripeChargeId?: string;
    receiptUrl?: string;
    details?: string;
}
