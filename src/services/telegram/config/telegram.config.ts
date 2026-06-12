import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => ({
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    channelId: process.env.TELEGRAM_CHANNEL_ID || '',
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    storeBaseUrl: process.env.STORE_BASE_URL || 'https://example.com',
}));
