import {
    Injectable,
    NotFoundException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '~/entities/user.entity';
import { CreateUserDto } from '~/services/user/dto/create-user.dto';
import { UpdateUserDto } from '~/services/user/dto/update-user.dto';
import { UserInfoResponse } from '~/services/user/dto/user-info-response.dto';
import { AuthService } from '~/services/auth/auth.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,

        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService
    ) {}

    async create(dto: CreateUserDto): Promise<UserEntity> {
        const user = this.userRepo.create(dto);
        return this.userRepo.save(user);
    }

    async findOne(id: string): Promise<UserEntity | null> {
        return this.userRepo.findOne({ where: { id } });
    }

    async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
        return this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepo.findOne({ where: { email } });
    }

    async findOneDetailed(id: string): Promise<UserInfoResponse> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['reviews', 'purchases'],
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                birthDate: true,
                avatarUrl: true,
                reviews: true,
                purchases: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with id "${id}" not found`);
        }

        return user as UserInfoResponse;
    }

    async update(id: string, dto: UpdateUserDto): Promise<UserInfoResponse> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['reviews', 'purchases'],
        });

        if (!user) {
            throw new NotFoundException(`User with id "${id}" not found`);
        }

        Object.assign(user, dto);
        const saved = await this.userRepo.save(user);

        const {
            id: userId,
            email,
            firstName,
            lastName,
            birthDate,
            avatarUrl,
            reviews,
            purchases,
        } = saved;

        return {
            id: userId,
            email,
            firstName,
            lastName,
            birthDate,
            avatarUrl,
            reviews,
            purchases,
        };
    }

    async delete(id: string, accessToken: string): Promise<void> {
        await this.authService.logout(id, accessToken);

        const result = await this.userRepo.delete(id);
        if (!result.affected) {
            throw new NotFoundException(`User with id "${id}" not found`);
        }
    }
}
