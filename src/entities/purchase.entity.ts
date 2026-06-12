import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { UserEntity } from '~/entities/user.entity';

export const PurchaseType = Object.freeze({
    VINYL: 'vinyl',
});
export type PurchaseType = (typeof PurchaseType)[keyof typeof PurchaseType];

@Entity('purchases')
export class PurchaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 20 })
    PurchaseType: PurchaseType;

    @Column({ type: 'int' })
    amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    totalPrice: number;

    @Column({ type: 'varchar', length: 10, default: 'usd' })
    currency: string;

    @Column({ type: 'text', nullable: true })
    details?: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    stripePaymentIntentId: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    stripeChargeId?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    receiptUrl?: string;

    @ManyToOne(() => UserEntity, (user) => user.purchases, {
        onDelete: 'CASCADE',
    })
    user: UserEntity;

    @CreateDateColumn()
    createdAt: Date;
}
