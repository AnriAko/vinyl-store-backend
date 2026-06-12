import { Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import telegramConfig from './config/telegram.config';
import { Inject } from '@nestjs/common';

interface VinylPayload {
    name: string;
    author: string;
    price: number;
    id: string;
}

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly telegramApiUrl: string;

    private readonly messageQueue: (() => Promise<void>)[] = [];
    private isProcessing = false;

    private readonly delayBetweenMessages = 1000;

    constructor(
        @Inject(telegramConfig.KEY)
        private readonly config: ConfigType<typeof telegramConfig>
    ) {
        this.telegramApiUrl = `https://api.telegram.org/bot${this.config.botToken}`;
    }

    async postVinylAnnouncement(vinyl: VinylPayload) {
        if (!this.config.enabled) {
            this.logger.warn('Telegram integration is disabled');
            return;
        }

        const storeLink = `${this.config.storeBaseUrl}/vinyl/${vinyl.id}`;
        const message = `
<b>🎵 New vinyl added!</b>

<b>Title:</b> ${vinyl.name}
<b>Artist:</b> ${vinyl.author}
<b>Price:</b> $${vinyl.price}

<a href="${storeLink}">🛒 View in store</a>
        `.trim();

        this.enqueue(async () => {
            try {
                await axios.post(`${this.telegramApiUrl}/sendMessage`, {
                    chat_id: this.config.channelId,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                });

                this.logger.log(
                    `Vinyl "${vinyl.name}" announcement sent to Telegram`
                );
            } catch (error: any) {
                if (error.response?.status === 429) {
                    const retryAfter =
                        error.response.data?.parameters?.retry_after ?? 5;
                    this.logger.warn(
                        `Rate limit hit, retrying in ${retryAfter}s`
                    );
                    await new Promise((r) => setTimeout(r, retryAfter * 1000));
                    await this.postVinylAnnouncement(vinyl);
                } else {
                    this.logger.error(
                        `Failed to send message to Telegram: ${error.message}`
                    );
                }
            }
        });
    }

    private enqueue(task: () => Promise<void>) {
        this.messageQueue.push(task);
        if (!this.isProcessing) this.processQueue();
    }

    private async processQueue() {
        this.isProcessing = true;

        while (this.messageQueue.length > 0) {
            const nextTask = this.messageQueue.shift();
            if (!nextTask) continue;

            await nextTask();
            await new Promise((resolve) =>
                setTimeout(resolve, this.delayBetweenMessages)
            );
        }

        this.isProcessing = false;
    }
}
