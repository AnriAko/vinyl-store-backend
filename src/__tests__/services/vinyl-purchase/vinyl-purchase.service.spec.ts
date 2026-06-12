import { describe, it, before, beforeEach, after } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { expect } from '~/__tests__/test-utils/expect-util';
import {
    setupTestModule,
    resetMocks,
} from '~/__tests__/test-utils/setup-test-module';

import { PurchaseService } from '~/services/purchase/purchase.service';
import { VinylService } from '~/services/vinyl/vinyl.service';
import { StripeService } from '~/infrastructure/stripe/stripe.service';
import { PurchaseEntity, PurchaseType } from '~/entities/purchase.entity';
import { VinylPurchaseService } from '~/services/vinyl-purchase/vinyl-purchase.service';

describe('VinylPurchaseService (e2e)', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let vinylPurchaseService: VinylPurchaseService;

    let mockVinylService: Partial<Record<keyof VinylService, any>>;
    let mockStripeService: Partial<Record<keyof StripeService, any>>;
    let mockPurchaseService: Partial<Record<keyof PurchaseService, any>>;

    before(async () => {
        mockVinylService = {
            findOne: async (id: string) => ({
                id,
                price: 20,
                currency: 'usd',
                name: 'Test Vinyl',
                authorName: 'Author',
                description: 'Description',
                averageScore: 4.5,
            }),
        };

        mockStripeService = {
            createPaymentIntent: async (_params: any) => ({
                id: 'pi_test',
                client_secret: 'secret_123',
            }),
            savePendingPurchase: async () => {},
            getPendingPurchase: async (id: string) => ({ id }),
            clearPendingPurchase: async () => {},
        };

        mockPurchaseService = {
            createSuccessfulPurchase: async (params: any) =>
                ({ ...params, id: 'purchase_test' }) as PurchaseEntity,
            getByUser: async () => [],
            getById: async (id: string) =>
                ({ id, PurchaseType: PurchaseType.VINYL }) as any,
        };

        const builder = await setupTestModule({
            providers: [
                VinylPurchaseService,
                { provide: VinylService, useValue: mockVinylService },
                { provide: StripeService, useValue: mockStripeService },
                { provide: PurchaseService, useValue: mockPurchaseService },
            ],
        });

        moduleRef = await builder.compile();
        app = moduleRef.createNestApplication();
        await app.init();

        vinylPurchaseService = moduleRef.get(VinylPurchaseService);
    });

    beforeEach(async () => {
        await resetMocks();
    });

    after(async () => {
        await app.close();
    });

    it('should create checkout successfully', async () => {
        const result = await vinylPurchaseService.createCheckout({
            userId: 'user_1',
            vinylId: 'vinyl_1',
            amount: 2,
        });

        expect(result.clientSecret).toBe('secret_123');
    });

    it('should throw NotFoundException if vinyl not found', async () => {
        mockVinylService.findOne = async () => null;

        let errorCaught = false;
        try {
            await vinylPurchaseService.createCheckout({
                userId: 'user_1',
                vinylId: 'missing_vinyl',
                amount: 1,
            });
        } catch (e) {
            errorCaught = e instanceof NotFoundException;
        }
        expect(errorCaught).toBe(true);
    });

    it('should handle succeeded payment', async () => {
        const purchase = await vinylPurchaseService.handleSucceededPayment({
            userId: 'user_1',
            purchaseType: PurchaseType.VINYL,
            amount: 2,
            price: 20,
            currency: 'usd',
            details: '{}',
            stripePaymentIntentId: 'pi_test',
        });

        expect(purchase?.id).toBe('purchase_test');
    });

    it('should return undefined if pending purchase not found', async () => {
        mockStripeService.getPendingPurchase = async () => null;

        const result = await vinylPurchaseService.handleSucceededPayment({
            userId: 'user_1',
            purchaseType: PurchaseType.VINYL,
            amount: 1,
            price: 10,
            currency: 'usd',
            details: '{}',
            stripePaymentIntentId: 'pi_missing',
        });

        expect(result).toBeUndefined();
    });

    it('should get all vinyl purchases by user', async () => {
        mockPurchaseService.getByUser = async () =>
            [{ id: 'purchase_1', PurchaseType: PurchaseType.VINYL }] as any;

        const result =
            await vinylPurchaseService.getAllVinylPurchasesByUser('user_1');
        expect(result.length).toBe(1);
        expect(result[0].PurchaseType).toBe(PurchaseType.VINYL);
    });

    it('should get one vinyl purchase by id', async () => {
        const purchase =
            await vinylPurchaseService.getOneVinylPurchaseById('purchase_1');
        expect(purchase.id).toBe('purchase_1');
        expect(purchase.PurchaseType).toBe(PurchaseType.VINYL);
    });

    it('should throw NotFoundException if vinyl purchase type mismatch', async () => {
        mockPurchaseService.getById = async () =>
            ({ id: 'purchase_2', PurchaseType: 'other' }) as any;

        let errorCaught = false;
        try {
            await vinylPurchaseService.getOneVinylPurchaseById('purchase_2');
        } catch (e) {
            errorCaught = e instanceof NotFoundException;
        }
        expect(errorCaught).toBe(true);
    });
});
