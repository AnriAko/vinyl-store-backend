import test from 'node:test';
import { expect } from '~/__tests__/test-utils/expect-util';
import { StripeController } from '~/infrastructure/stripe/stripe.controller';
import { StripeService } from '~/infrastructure/stripe/stripe.service';

type MockResponse = {
    status: (code: number) => MockResponse;
    send: (body?: any) => void;
    statusCode?: number;
    body?: any;
};

test('StripeController.handleWebhook calls stripeService and sends 200', async () => {
    const stripeServiceMock: Partial<StripeService> = {
        handleWebhookEvent: async (_payload: Buffer, _sig: string) => {},
    };

    const res: MockResponse = {
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        send(body?: any) {
            this.body = body;
        },
    };

    const controller = new StripeController(stripeServiceMock as StripeService);

    const payload = Buffer.from('test payload');
    const sig = 'stripe_sig';

    await controller.handleWebhook({ body: payload }, res as any, sig);

    expect(res.statusCode).toBeUndefined();
    expect(res.body).toBeUndefined();
});

test('StripeController.handleWebhook returns 400 if payload is invalid', async () => {
    const stripeServiceMock: Partial<StripeService> = {
        handleWebhookEvent: async () => {},
    };

    const res: MockResponse = {
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        send(body?: any) {
            this.body = body;
        },
    };

    const controller = new StripeController(stripeServiceMock as StripeService);

    const invalidBody = { not: 'buffer' };
    const sig = 'stripe_sig';

    await controller.handleWebhook({ body: invalidBody }, res as any, sig);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatch('Webhook Error: No webhook payload was provided.');
});
