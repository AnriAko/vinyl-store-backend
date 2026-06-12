import test from 'node:test';
import Stripe from 'stripe';
import { expect } from '~/__tests__/test-utils/expect-util';
import { PurchaseType } from '~/entities/purchase.entity';
import { StripeService } from '~/infrastructure/stripe/stripe.service';
import { generateStripeMailTemplate } from '~/infrastructure/stripe/utils/stripe-mail';
import { PurchaseParams } from '~/services/purchase/types/purchase-params';

const redisServiceMockBase = {
    get: async (_key: string) => null,
    set: async (_key: string, _value: string, _ttl?: number) => {},
    del: async (_key: string) => {},
};
const userServiceMock = {
    findOne: async (id: string) => {
        if (id === 'user_1') {
            return { id: 'user_1', email: 'user1@example.com' };
        }
        return null;
    },
};
type VinylPurchaseMockType = {
    handleSucceededPayment: (data: PurchaseParams) => Promise<void>;
    called: boolean;
    lastCall: Partial<PurchaseParams> | null;
};
const mailServiceMock = {
    sendMail: async (
        _to: string,
        _subject: string,
        _text: string,
        _html: string
    ) => {},
};

const vinylPurchaseServiceMock: VinylPurchaseMockType = {
    handleSucceededPayment: async (data) => {
        vinylPurchaseServiceMock.called = true;
        vinylPurchaseServiceMock.lastCall = data;
    },
    called: false,
    lastCall: null,
};

const purchaseServiceMock = {
    existsByPaymentIntent: async (_id: string) => false,
};

const stripeConfMock = {
    secretKey: 'sk_test_mock',
    publicKey: 'pk_test_mock',
    webhookSecret: 'whsec_test_mock',
    redis: {
        keyPrefix: 'stripe:',
        ttl: 3600,
    },
};

const stripePaymentIntentMock = {
    id: 'pi_123',
    currency: 'usd',
    metadata: {
        userId: 'user_1',
        purchaseType: PurchaseType.VINYL,
        price: '10',
        amount: '2',
        details: 'Test purchase',
    },
    charges: { data: [{ id: 'ch_123', receipt_url: 'url_123' }] },
};

class StripeMock {
    paymentIntents = {
        create: async (_data: any, _opts?: any) => stripePaymentIntentMock,
        retrieve: async (_id: string) => stripePaymentIntentMock,
    };
    webhooks = {
        constructEvent: (_payload: Buffer, _sig: string, _secret: string) => ({
            type: 'payment_intent.succeeded',
            data: { object: stripePaymentIntentMock },
        }),
    };
}

test('StripeService.createPaymentIntent returns correct payment intent', async () => {
    const service = new StripeService(
        redisServiceMockBase as any,
        vinylPurchaseServiceMock as any,
        purchaseServiceMock as any,
        stripeConfMock as any,
        mailServiceMock as any,
        userServiceMock as any
    );
    (service as any).stripe = new StripeMock() as unknown as Stripe;

    const paymentIntent = await service.createPaymentIntent({
        price: 10,
        amount: 2,
        currency: 'usd',
        purchaseType: PurchaseType.VINYL,
        userId: 'user_1',
        details: 'Test purchase',
    });

    expect(paymentIntent.id).toBe('pi_123');
    expect(paymentIntent.currency).toBe('usd');
    expect(paymentIntent.metadata.userId).toBe('user_1');
    expect(paymentIntent.metadata.purchaseType).toBe(PurchaseType.VINYL);
});

test('StripeService.savePendingPurchase and getPendingPurchase store and retrieve purchase correctly', async () => {
    const redisStore: Record<string, string> = {};
    const redisMock = {
        get: async (key: string) => redisStore[key] || null,
        set: async (key: string, value: string) => (redisStore[key] = value),
        del: async (key: string) => delete redisStore[key],
    };

    const service = new StripeService(
        redisMock as any,
        vinylPurchaseServiceMock as any,
        purchaseServiceMock as any,
        stripeConfMock as any,
        mailServiceMock as any,
        userServiceMock as any
    );

    await service.savePendingPurchase('pi_1', {
        userId: 'u1',
        purchaseType: PurchaseType.VINYL,
        price: 10,
        amount: 1,
        currency: 'usd',
        stripePaymentIntentId: 'pi_1',
        stripeChargeId: '',
        receiptUrl: '',
        details: '',
    });

    const pending = await service.getPendingPurchase('pi_1');
    expect(pending).toBeDefined();
    expect(pending!.userId).toBe('u1');
    expect(pending!.purchaseType).toBe(PurchaseType.VINYL);
    expect(pending!.price).toBe(10);
    expect(pending!.amount).toBe(1);
});

test('StripeService.handleWebhookEvent processes succeeded payment', async () => {
    vinylPurchaseServiceMock.called = false;
    vinylPurchaseServiceMock.lastCall = null;

    const service = new StripeService(
        redisServiceMockBase as any,
        vinylPurchaseServiceMock as any,
        purchaseServiceMock as any,
        stripeConfMock as any,
        mailServiceMock as any,
        userServiceMock as any
    );
    (service as any).stripe = new StripeMock() as unknown as Stripe;

    await service.handleWebhookEvent(Buffer.from(''), 'sig_test');

    expect(vinylPurchaseServiceMock.called).toBeTruthy();
    expect(vinylPurchaseServiceMock.lastCall).toBeDefined();
    expect(vinylPurchaseServiceMock.lastCall!.stripePaymentIntentId).toBe(
        'pi_123'
    );
    expect(vinylPurchaseServiceMock.lastCall!.stripeChargeId).toBe('ch_123');
    expect(vinylPurchaseServiceMock.lastCall!.receiptUrl).toBe('url_123');
    expect(vinylPurchaseServiceMock.lastCall!.userId).toBe('user_1');
    expect(vinylPurchaseServiceMock.lastCall!.purchaseType).toBe(
        PurchaseType.VINYL
    );
    test('StripeService.getPaymentIntent returns cached payment intent', async () => {
        const redisMock = {
            get: async (_key: string) =>
                JSON.stringify(stripePaymentIntentMock),
            set: async () => {},
        };
        const service = new StripeService(
            redisMock as any,
            vinylPurchaseServiceMock as any,
            purchaseServiceMock as any,
            stripeConfMock as any,
            mailServiceMock as any,
            userServiceMock as any
        );
        const pi = await service.getPaymentIntent('pi_123');
        expect(pi).toBeDefined();
        expect(pi!.id).toBe('pi_123');
    });
    test('handleWebhookEvent returns early if parsed.userId is missing', async () => {
        const service = new StripeService(
            redisServiceMockBase as any,
            vinylPurchaseServiceMock as any,
            purchaseServiceMock as any,
            stripeConfMock as any,
            mailServiceMock as any,
            userServiceMock as any
        );

        (service as any).stripe = new StripeMock() as unknown as Stripe;

        (service as any).parsePaymentIntentFromEvent = async () => ({
            userId: '',
        });
        await service.handleWebhookEvent(Buffer.from(''), 'sig_test');
    });

    test('handleWebhookEvent returns early if payment intent already exists', async () => {
        const service = new StripeService(
            redisServiceMockBase as any,
            vinylPurchaseServiceMock as any,
            { existsByPaymentIntent: async () => true } as any,
            stripeConfMock as any,
            mailServiceMock as any,
            userServiceMock as any
        );

        (service as any).stripe = new StripeMock() as unknown as Stripe;
        (service as any).parsePaymentIntentFromEvent = async () => ({
            userId: 'user_1',
            stripePaymentIntentId: 'pi_123',
            purchaseType: PurchaseType.VINYL,
            price: 10,
            amount: 1,
            currency: 'usd',
        });

        await service.handleWebhookEvent(Buffer.from(''), 'sig_test');
    });

    test('getPurchaseHandler throws NotFoundException for unknown type', () => {
        const service = new StripeService(
            redisServiceMockBase as any,
            vinylPurchaseServiceMock as any,
            purchaseServiceMock as any,
            stripeConfMock as any,
            mailServiceMock as any,
            userServiceMock as any
        );
        expect(() => (service as any).getPurchaseHandler('UNKNOWN')).toThrow();
    });
    test('parsePaymentIntentFromEvent handles invalid JSON in details', async () => {
        const service = new StripeService(
            redisServiceMockBase as any,
            vinylPurchaseServiceMock as any,
            purchaseServiceMock as any,
            stripeConfMock as any,
            mailServiceMock as any,
            userServiceMock as any
        );

        (service as any).stripe = new StripeMock() as unknown as Stripe;

        const event = {
            data: {
                object: {
                    ...stripePaymentIntentMock,
                    metadata: {
                        ...stripePaymentIntentMock.metadata,
                        details: 'invalid json',
                    },
                },
            },
        } as any;

        const parsed = await (service as any).parsePaymentIntentFromEvent(
            event
        );
        expect(parsed).toBeDefined();
        expect(parsed.itemName).toBeUndefined();
    });

    test('sendPurchaseMail does nothing if user not found', async () => {
        const service = new StripeService(
            redisServiceMockBase as any,
            vinylPurchaseServiceMock as any,
            purchaseServiceMock as any,
            stripeConfMock as any,
            mailServiceMock as any,
            { findOne: async () => null } as any
        );
        await (service as any).sendPurchaseMail({
            userId: 'no-user',
            purchaseType: PurchaseType.VINYL,
            amount: 1,
            price: 10,
            currency: 'usd',
        });
    });

    test('sendPurchaseMail does nothing if user has no email', async () => {
        const service = new StripeService(
            redisServiceMockBase as any,
            vinylPurchaseServiceMock as any,
            purchaseServiceMock as any,
            stripeConfMock as any,
            mailServiceMock as any,
            { findOne: async () => ({ id: 'u1' }) } as any
        );
        await (service as any).sendPurchaseMail({
            userId: 'u1',
            purchaseType: PurchaseType.VINYL,
            amount: 1,
            price: 10,
            currency: 'usd',
        });
    });
    test('setStripePaymentIntentCache sets payment intent in Redis with TTL', async () => {
        let calledKey = '',
            calledValue = '',
            calledTTL = 0;
        const redisMock = {
            set: async (k: string, v: string, ttl?: number) => {
                calledKey = k;
                calledValue = v;
                calledTTL = ttl!;
            },
        };
        const service = new StripeService(
            redisMock as any,
            vinylPurchaseServiceMock as any,
            purchaseServiceMock as any,
            stripeConfMock as any,
            mailServiceMock as any,
            userServiceMock as any
        );
        await (service as any).setStripePaymentIntentCache(
            stripePaymentIntentMock as any,
            123
        );
        expect(calledKey).toContain('stripe:');
        expect(calledValue).toContain('pi_123');
        expect(calledTTL).toBe(123);
    });
    test('generateStripeMailTemplate returns correct mail data', () => {
        const successParams1 = {
            itemName: 'Vinyl Record',
            quantity: 2,
            totalCost: 40,
            currency: 'usd',
            receiptUrl: 'https://example.com/receipt',
            succeeded: true,
        };
        const successMail1 = generateStripeMailTemplate(successParams1);
        expect(successMail1.subject).toBe('Your purchase was successful!');
        expect(successMail1.text).toContain('2 × Vinyl Record');
        expect(successMail1.text).toContain('40 USD');
        expect(successMail1.html).toContain('Purchase Successful!');
        expect(successMail1.html).toContain(successParams1.receiptUrl);

        const successParams2 = {
            quantity: 1,
            totalCost: 10,
            currency: 'eur',
            succeeded: true,
        };
        const successMail2 = generateStripeMailTemplate(successParams2);
        expect(successMail2.subject).toBe('Your purchase was successful!');
        expect(successMail2.text).toContain('1 × item');
        expect(successMail2.text).toContain('10 EUR');
        expect(successMail2.html).toContain('Purchase Successful!');
        expect(successMail2.html).not.toContain('<a href="');

        const failParams1 = {
            itemName: 'Vinyl Record',
            quantity: 1,
            totalCost: 20,
            currency: 'usd',
            succeeded: false,
            failureReason: 'Card declined',
        };
        const failMail1 = generateStripeMailTemplate(failParams1);
        expect(failMail1.subject).toBe('Your purchase failed');
        expect(failMail1.text).toContain('1 × Vinyl Record');
        expect(failMail1.text).toContain('Reason: Card declined');
        expect(failMail1.html).toContain('Purchase Failed');
        expect(failMail1.html).toContain('Card declined');

        const failParams2 = {
            quantity: 3,
            totalCost: 60,
            currency: 'usd',
            succeeded: false,
        };
        const failMail2 = generateStripeMailTemplate(failParams2);
        expect(failMail2.subject).toBe('Your purchase failed');
        expect(failMail2.text).toContain('3 × item');
        expect(failMail2.text).not.toContain('Reason:');
        expect(failMail2.html).toContain('Purchase Failed');
    });
});
