import {
    Entity,
    Column,
    CreateDateColumn,
    ManyToOne,
    PrimaryColumn,
    Unique,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '~/entities/user.entity';
import { VinylEntity } from '~/entities/vinyl.entity';

@Entity('reviews')
@Unique(['user', 'vinyl'])
export class ReviewEntity {
    @PrimaryColumn('uuid')
    userId: string;

    @PrimaryColumn('uuid')
    vinylId: string;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ type: 'int' })
    score: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => UserEntity, (user) => user.reviews, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @ManyToOne(() => VinylEntity, (vinyl) => vinyl.reviews, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'vinylId' })
    vinyl: VinylEntity;
}
