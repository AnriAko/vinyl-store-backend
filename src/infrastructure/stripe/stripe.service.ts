import {
    Injectable,
    Inject,
    NotFoundException,
    forwardRef,
    Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigType } from '@nestjs/config';
import stripeConfig from './config/stripe.config';
import { RedisService } from '~/infrastructure/redis/redis.service';
import { VinylPurchaseService } from '~/services/vinyl-purchase/vinyl-purchase.service';
import { PurchaseService } from '~/services/purchase/purchase.service';
import { PurchaseType } from '~/entities/purchase.entity';
import { PurchaseParams } from '~/services/purchase/types/purchase-params';
import { MailService } from '~/infrastructure/mail/mail.service';
import { generateStripeMailTemplate } from '~/infrastructure/stripe/utils/stripe-mail';
import { UserService } from '~/services/user/user.service';

export interface ParsedPaymentIntent {
    userId: string;
    purchaseType: PurchaseType;
    amount: number;
    price: number;
    currency: string;
    stripePaymentIntentId?: string;
    chargeId?: string;
    receiptUrl?: string;
    failureReason?: string;
    itemName?: string;
}

type StripePaymentIntentWithCharges = Stripe.PaymentIntent & {
    charges?: { data?: Stripe.Charge[] };
};

@Injectable()
export class StripeService {
    private readonly stripe: Stripe;
    private readonly logger = new Logger('StripeService');

    constructor(
        private readonly redisService: RedisService,
        @Inject(forwardRef(() => VinylPurchaseService))
        private readonly vinylPurchaseService: VinylPurchaseService,
        private readonly purchaseService: PurchaseService,
        @Inject(stripeConfig.KEY)
        private readonly stripeConf: ConfigType<typeof stripeConfig>,
        private readonly mailService: MailService,
        private readonly userService: UserService
    ) {
        this.stripe = new Stripe(this.stripeConf.secretKey);
    }

    async createPaymentIntent(
        params: Omit<
            PurchaseParams,
            'stripePaymentIntentId' | 'stripeChargeId' | 'receiptUrl'
        > & { idempotencyKey?: string }
    ): Promise<Stripe.PaymentIntent> {
        const {
            price,
            amount,
            currency,
            purchaseType,
            userId,
            details,
            idempotencyKey,
        } = params;

        const totalInCents = Math.round(Number(price) * amount * 100);

        const metadataForStripe: Record<string, string> = {
            userId,
            purchaseType,
            price: String(price),
            amount: String(amount),
            details: details || '',
        };

        const paymentIntent = await this.stripe.paymentIntents.create(
            {
                amount: totalInCents,
                currency,
                metadata: metadataForStripe,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never',
                },
            },
            idempotencyKey ? { idempotencyKey } : undefined
        );

        await this.setStripePaymentIntentCache(paymentIntent);
        return paymentIntent;
    }

    async getPaymentIntent(id: string): Promise<Stripe.PaymentIntent | null> {
        const cached = await this.redisService.get(
            this.getStripePaymentIntentKey(id)
        );
        if (cached) return JSON.parse(cached);

        const paymentIntent = await this.stripe.paymentIntents.retrieve(id);
        await this.setStripePaymentIntentCache(paymentIntent, 600);
        return paymentIntent;
    }

    constructEventFromWebhook(payload: Buffer, sig: string): Stripe.Event {
        return this.stripe.webhooks.constructEvent(
            payload,
            sig,
            this.stripeConf.webhookSecret
        );
    }

    async handleWebhookEvent(payload: Buffer, sig: string): Promise<void> {
        const event = this.constructEventFromWebhook(payload, sig);

        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const parsed =
                        await this.parsePaymentIntentFromEvent(event);
                    if (!parsed?.userId) return;

                    const exists =
                        await this.purchaseService.existsByPaymentIntent(
                            parsed.stripePaymentIntentId!
                        );
                    if (exists) return;

                    await this.saveSuccessfulPurchase(parsed);
                    await this.sendPurchaseMail(parsed);
                    break;
                }

                case 'charge.succeeded': {
                    const charge = event.data.object as Stripe.Charge;
                    const paymentIntentId =
                        typeof charge.payment_intent === 'string'
                            ? charge.payment_intent
                            : charge.payment_intent?.id;

                    if (!paymentIntentId) return;

                    const paymentIntent =
                        await this.stripe.paymentIntents.retrieve(
                            paymentIntentId,
                            { expand: ['charges.data'] }
                        );

                    const fakeEvent: Stripe.Event = {
                        id: event.id,
                        type: 'payment_intent.succeeded',
                        data: { object: paymentIntent },
                        api_version: event.api_version,
                        created: event.created,
                        livemode: event.livemode,
                        object: event.object,
                        pending_webhooks: event.pending_webhooks,
                        request: event.request,
                    };

                    const parsed =
                        await this.parsePaymentIntentFromEvent(fakeEvent);
                    if (!parsed?.userId) return;

                    const exists =
                        await this.purchaseService.existsByPaymentIntent(
                            parsed.stripePaymentIntentId!
                        );
                    if (exists) return;

                    await this.saveSuccessfulPurchase(parsed);
                    await this.sendPurchaseMail(parsed);
                    break;
                }

                default:
                    break;
            }
        } catch (err: any) {
            this.logger.error(`[Webhook error]: ${err.message}`);
            throw err;
        }
    }

    getClient(): Stripe {
        return this.stripe;
    }

    async savePendingPurchase(
        paymentIntentId: string,
        data: PurchaseParams
    ): Promise<void> {
        await this.redisService.set(
            `${this.stripeConf.redis.keyPrefix}${paymentIntentId}`,
            JSON.stringify(data),
            this.stripeConf.redis.ttl
        );
    }

    async getPendingPurchase(
        paymentIntentId: string
    ): Promise<PurchaseParams | null> {
        const raw = await this.redisService.get(
            `${this.stripeConf.redis.keyPrefix}${paymentIntentId}`
        );
        return raw ? (JSON.parse(raw) as PurchaseParams) : null;
    }

    async clearPendingPurchase(paymentIntentId: string): Promise<void> {
        await this.redisService.del(
            `${this.stripeConf.redis.keyPrefix}${paymentIntentId}`
        );
    }

    private getPurchaseHandler(purchaseType: PurchaseType) {
        if (purchaseType === PurchaseType.VINYL)
            return this.vinylPurchaseService;
        throw new NotFoundException(
            `No handler found for purchase type: ${purchaseType}`
        );
    }

    private async parsePaymentIntentFromEvent(
        event: Stripe.Event
    ): Promise<ParsedPaymentIntent | null> {
        const paymentIntent = event.data
            .object as StripePaymentIntentWithCharges;
        const metadata = paymentIntent.metadata || {};

        const base: ParsedPaymentIntent = {
            userId: metadata.userId!,
            purchaseType:
                (metadata.purchaseType as PurchaseType) || PurchaseType.VINYL,
            amount: Number(metadata.amount),
            price: Number(metadata.price),
            currency: paymentIntent.currency!,
            stripePaymentIntentId: paymentIntent.id,
            chargeId: undefined,
            receiptUrl: undefined,
            failureReason: paymentIntent.last_payment_error?.message,
            itemName: undefined,
        };

        if (metadata.details) {
            try {
                const details = JSON.parse(metadata.details);
                base.itemName = details.name;
            } catch {}
        }

        const fullPaymentIntent = (await this.stripe.paymentIntents.retrieve(
            paymentIntent.id,
            { expand: ['charges.data'] }
        )) as StripePaymentIntentWithCharges;
        const charge = fullPaymentIntent.charges?.data?.[0];
        if (charge) {
            base.chargeId = charge.id;
            base.receiptUrl = charge.receipt_url ?? undefined;
        }

        return base;
    }

    private async saveSuccessfulPurchase(
        parsed: ParsedPaymentIntent
    ): Promise<void> {
        const handler = this.getPurchaseHandler(parsed.purchaseType);
        await handler.handleSucceededPayment({
            userId: parsed.userId,
            purchaseType: parsed.purchaseType,
            amount: parsed.amount,
            price: parsed.price,
            currency: parsed.currency,
            stripePaymentIntentId: parsed.stripePaymentIntentId!,
            stripeChargeId: parsed.chargeId,
            receiptUrl: parsed.receiptUrl,
            details: JSON.stringify({
                name: parsed.itemName,
            }),
        });
    }

    private async sendPurchaseMail(parsed: ParsedPaymentIntent): Promise<void> {
        const user = await this.userService.findOne(parsed.userId);
        if (!user?.email) return;

        const totalCost = ((parsed.amount || 0) * (parsed.price || 0)).toFixed(
            2
        );

        const mailData = generateStripeMailTemplate({
            itemName: parsed.itemName || parsed.purchaseType || 'unknown',
            quantity: parsed.amount || 0,
            totalCost: parseFloat(totalCost),
            currency: parsed.currency || 'usd',
            receiptUrl: parsed.receiptUrl,
            succeeded: !parsed.failureReason,
            failureReason: parsed.failureReason,
        });

        await this.mailService.sendMail(
            user.email,
            mailData.subject,
            mailData.text,
            mailData.html
        );
    }

    private getStripePaymentIntentKey(id: string) {
        return `${this.stripeConf.redis.keyPrefix}${id}`;
    }

    private async setStripePaymentIntentCache(
        paymentIntent: Stripe.PaymentIntent,
        ttl?: number
    ) {
        await this.redisService.set(
            this.getStripePaymentIntentKey(paymentIntent.id),
            JSON.stringify(paymentIntent),
            ttl || this.stripeConf.redis.ttl
        );
    }
}
