import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TelegramService } from '~/services/telegram/telegram.service';

@Injectable()
export class VinylEventsListener {
    private readonly logger = new Logger(VinylEventsListener.name);

    constructor(private readonly telegramService: TelegramService) {}

    @OnEvent('vinyl.created', { async: true })
    async handleVinylCreatedEvent(payload: {
        id: string;
        name: string;
        author: string;
        price: number;
    }) {
        try {
            await this.telegramService.postVinylAnnouncement(payload);
        } catch (error) {
            this.logger.warn(
                `Failed to post vinyl "${payload.name}" to Telegram: ${error}`
            );
        }
    }
}
