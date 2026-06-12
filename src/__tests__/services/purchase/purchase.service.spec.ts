import { describe, it, before, beforeEach, after } from 'node:test';
import {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    setupTestModule,
    resetMocks,
} from '~/__tests__/test-utils/setup-test-module';
import { expect } from '~/__tests__/test-utils/expect-util';

import { PurchaseService } from '~/services/purchase/purchase.service';
import { PurchaseEntity, PurchaseType } from '~/entities/purchase.entity';
import { UserEntity, UserRole } from '~/entities/user.entity';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '~/services/auth/guards/roles/roles.guard';

class MockAccessJwtGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 'mock-user-id', role: 'user' };
        return true;
    }
}

class MockRolesGuard implements CanActivate {
    canActivate(): boolean {
        return true;
    }
}

describe('PurchaseService (e2e)', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let purchaseService: PurchaseService;
    let purchaseRepo: Repository<PurchaseEntity>;
    let userRepo: Repository<UserEntity>;

    before(async () => {
        const builder = await setupTestModule({
            providers: [PurchaseService],
            imports: [TypeOrmModule.forFeature([PurchaseEntity, UserEntity])],
        });

        builder
            .overrideGuard(AuthGuard('access-jwt'))
            .useClass(MockAccessJwtGuard)
            .overrideGuard(RolesGuard)
            .useClass(MockRolesGuard);

        moduleRef = await builder.compile();
        app = moduleRef.createNestApplication();
        await app.init();

        purchaseService = moduleRef.get(PurchaseService);
        purchaseRepo = moduleRef.get(getRepositoryToken(PurchaseEntity));
        userRepo = moduleRef.get(getRepositoryToken(UserEntity));
    });

    beforeEach(async () => {
        await resetMocks();
        await purchaseRepo.clear();
        await userRepo.clear();

        await userRepo.insert({
            id: 'mock-user-id',
            email: 'mock@example.com',
            firstName: 'Mock',
            lastName: 'User',
            role: UserRole.USER,
        });
    });

    after(async () => {
        await app.close();
    });

    it('should create a successful purchase', async () => {
        const purchase = await purchaseService.createSuccessfulPurchase({
            userId: 'mock-user-id',
            purchaseType: PurchaseType.VINYL,
            amount: 2,
            price: 15.5,
            currency: 'usd',
            details: 'Test vinyl purchase',
            stripePaymentIntentId: 'pi_123',
            stripeChargeId: 'ch_123',
            receiptUrl: 'http://example.com/receipt.pdf',
        });

        expect(purchase.amount).toBe(2);
        expect(purchase.totalPrice).toBeCloseTo(31); // price * amount
        expect(purchase.user.id).toBe('mock-user-id');
        expect(purchase.stripePaymentIntentId).toBe('pi_123');
    });

    it('should get purchase by id', async () => {
        const saved = await purchaseService.createSuccessfulPurchase({
            userId: 'mock-user-id',
            purchaseType: PurchaseType.VINYL,
            amount: 1,
            price: 20,
            currency: 'usd',
            details: 'Another purchase',
            stripePaymentIntentId: 'pi_456',
        });

        const found = await purchaseService.getById(saved.id);
        expect(found).not.toBeNull();
        expect(found!.amount).toBe(1);
        expect(found!.user.id).toBe('mock-user-id');
    });

    it('should get all purchases by user', async () => {
        await purchaseService.createSuccessfulPurchase({
            userId: 'mock-user-id',
            purchaseType: PurchaseType.VINYL,
            amount: 1,
            price: 10,
            currency: 'usd',
            details: 'First',
            stripePaymentIntentId: 'pi_a',
        });
        await purchaseService.createSuccessfulPurchase({
            userId: 'mock-user-id',
            purchaseType: PurchaseType.VINYL,
            amount: 2,
            price: 15,
            currency: 'usd',
            details: 'Second',
            stripePaymentIntentId: 'pi_b',
        });

        const results = await purchaseService.getByUser('mock-user-id');
        expect(results.length).toBe(2);
        expect(results[0].user.id).toBe('mock-user-id');
        expect(results[1].user.id).toBe('mock-user-id');
    });

    it('should return true if purchase exists by payment intent', async () => {
        await purchaseService.createSuccessfulPurchase({
            userId: 'mock-user-id',
            purchaseType: PurchaseType.VINYL,
            amount: 1,
            price: 50,
            currency: 'usd',
            details: 'Payment intent test',
            stripePaymentIntentId: 'pi_exist',
        });

        const exists = await purchaseService.existsByPaymentIntent('pi_exist');
        expect(exists).toBe(true);

        const notExists =
            await purchaseService.existsByPaymentIntent('pi_none');
        expect(notExists).toBe(false);
    });
});
