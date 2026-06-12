import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import telegramConfig from '~/services/telegram/config/telegram.config';

@Module({
    imports: [ConfigModule.forFeature(telegramConfig)],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule {}
