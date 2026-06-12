import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VinylEntity } from '~/entities/vinyl.entity';
import { VinylController } from '~/services/vinyl/vinyl.controller';
import { VinylService } from '~/services/vinyl/vinyl.service';
import { TelegramModule } from '~/services/telegram/telegram.module';
import { VinylEventsListener } from '~/services/vinyl/vinyl.listener';

@Module({
    imports: [TypeOrmModule.forFeature([VinylEntity]), TelegramModule],
    controllers: [VinylController],
    providers: [VinylService, VinylEventsListener],
    exports: [VinylService],
})
export class VinylModule {}
