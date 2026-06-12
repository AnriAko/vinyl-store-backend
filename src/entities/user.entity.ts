import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PurchaseEntity } from '~/entities/purchase.entity';
import { ReviewEntity } from '~/entities/review.entity';

export const UserRole = Object.freeze({
    ADMIN: 'admin',
    USER: 'user',
});
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    provider: string;

    @Column({ nullable: true })
    providerId: string;

    @Column({
        type: 'varchar',
        default: UserRole.USER,
    })
    role: UserRole;

    @Column()
    email: string;

    @Column({ nullable: true, select: false })
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    birthDate: Date;

    @Column({ nullable: true })
    avatarUrl: string;

    @OneToMany(() => ReviewEntity, (review) => review.user)
    reviews: ReviewEntity[];

    @OneToMany(() => PurchaseEntity, (purchase) => purchase.user)
    purchases: PurchaseEntity[];
}
