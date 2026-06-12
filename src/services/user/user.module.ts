import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '~/entities/user.entity';
import { AuthModule } from '~/services/auth/auth.module';
import { UserController } from '~/services/user/user.controller';
import { UserService } from '~/services/user/user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        forwardRef(() => AuthModule),
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
