import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { UserEntity } from '~/entities/user.entity';
import { PurchaseParams } from '~/services/purchase/types/purchase-params';

@Injectable()
export class PurchaseService {
    private readonly logger = new Logger(PurchaseService.name);

    constructor(
        @InjectRepository(PurchaseEntity)
        private readonly purchaseRepository: Repository<PurchaseEntity>
    ) {}

    async createSuccessfulPurchase(
        params: PurchaseParams
    ): Promise<PurchaseEntity> {
        const totalPrice = Number(params.price) * params.amount;

        const purchase = this.purchaseRepository.create({
            user: { id: params.userId } as UserEntity,
            PurchaseType: params.purchaseType,
            amount: params.amount,
            price: params.price,
            totalPrice,
            currency: params.currency,
            details: params.details,
            stripePaymentIntentId: params.stripePaymentIntentId,
            stripeChargeId: params.stripeChargeId,
            receiptUrl: params.receiptUrl,
        });

        const saved = await this.purchaseRepository.save(purchase);
        this.logger.log(
            `Saved successful ${params.purchaseType} purchase: ${saved.id}`
        );

        return saved;
    }

    async getById(id: string): Promise<PurchaseEntity | null> {
        return this.purchaseRepository.findOne({
            where: { id },
            relations: ['user'],
        });
    }

    async getByUser(
        userId: string,
        purchaseType?: string
    ): Promise<PurchaseEntity[]> {
        const where: any = { user: { id: userId } };

        if (purchaseType) {
            where.PurchaseType = purchaseType;
        }

        return this.purchaseRepository.find({
            where,
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async existsByPaymentIntent(paymentIntentId: string): Promise<boolean> {
        const count = await this.purchaseRepository.count({
            where: { stripePaymentIntentId: paymentIntentId },
        });
        return count > 0;
    }
}
