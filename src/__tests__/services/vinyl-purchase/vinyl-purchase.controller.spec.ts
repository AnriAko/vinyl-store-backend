import test from 'node:test';
import { expect } from '~/__tests__/test-utils/expect-util';
import { VinylPurchaseService } from '~/services/vinyl-purchase/vinyl-purchase.service';
import { PurchaseType, PurchaseEntity } from '~/entities/purchase.entity';
import { VinylPurchaseController } from '~/services/vinyl-purchase/vinyl-purchase.controller';

type AuthRequest = { user: { userId: string } };

const mockPurchaseEntity = (id: string): PurchaseEntity => ({
    id,
    PurchaseType: PurchaseType.VINYL,
    amount: 2,
    price: 20,
    totalPrice: 40,
    currency: 'usd',
    details: '{}',
    stripePaymentIntentId: 'pi_123',
    stripeChargeId: 'ch_123',
    receiptUrl: 'receipt_url',
    user: { id: 'user_1' } as any,
    createdAt: new Date(),
});

test('VinylPurchaseController.createCheckout calls service and returns clientSecret', async () => {
    let lastCall: any = null;
    const serviceMock: Partial<VinylPurchaseService> = {
        createCheckout: async (params: any) => {
            lastCall = params;
            return { clientSecret: 'secret_123' };
        },
    };

    const controller = new VinylPurchaseController(
        serviceMock as VinylPurchaseService
    );
    const req: AuthRequest = { user: { userId: 'user_1' } };
    const vinylId = 'vinyl_1';
    const amount = '2';

    const result = await controller.createCheckout(req as any, vinylId, amount);

    expect(result.clientSecret).toBe('secret_123');
    expect(lastCall.userId).toBe('user_1');
    expect(lastCall.vinylId).toBe(vinylId);
    expect(lastCall.amount).toBe(2);
});

test('VinylPurchaseController.getAllVinylPurchases calls service with userId', async () => {
    let lastUserId = '';
    const serviceMock: Partial<VinylPurchaseService> = {
        getAllVinylPurchasesByUser: async (userId: string) => {
            lastUserId = userId;
            return [mockPurchaseEntity('purchase_1')];
        },
    };

    const controller = new VinylPurchaseController(
        serviceMock as VinylPurchaseService
    );
    const req: AuthRequest = { user: { userId: 'user_1' } };
    const result = await controller.getAllVinylPurchases(req as any);

    expect(lastUserId).toBe('user_1');
    expect(result.length).toBe(1);
    expect(result[0].PurchaseType).toBe(PurchaseType.VINYL);
});

test('VinylPurchaseController.getOneVinylPurchase calls service and returns purchase', async () => {
    const serviceMock: Partial<VinylPurchaseService> = {
        getOneVinylPurchaseById: async (id: string) => mockPurchaseEntity(id),
    };

    const controller = new VinylPurchaseController(
        serviceMock as VinylPurchaseService
    );
    const id = 'purchase_1';
    const result = await controller.getOneVinylPurchase(id);

    expect(result.id).toBe(id);
    expect(result.PurchaseType).toBe(PurchaseType.VINYL);
});
