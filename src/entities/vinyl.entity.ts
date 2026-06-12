import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ReviewEntity } from '~/entities/review.entity';

@Entity('vinyls')
export class VinylEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price: number;

    @Column({ type: 'varchar', length: 10, default: 'usd' })
    currency: string;

    @Column()
    name: string;

    @Column()
    authorName: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'float', default: 0 })
    averageScore: number;

    @Column({ type: 'varchar', nullable: true })
    imageUrl: string;

    @Column({ type: 'int', nullable: true, unique: true })
    discogsReleaseId: number;

    @Column({ type: 'float', nullable: true })
    discogsScore: number;

    @OneToMany(() => ReviewEntity, (review) => review.vinyl)
    reviews: ReviewEntity[];
}
