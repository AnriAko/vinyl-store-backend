import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
    secretKey: process.env.STRIPE_SECRET_KEY || 'default_stripe_secret',
    publicKey: process.env.STRIPE_PUBLIC_KEY || 'default_stripe_public',
    webhookSecret:
        process.env.STRIPE_WEBHOOK_SECRET || 'default_stripe_webhook',
    redis: {
        keyPrefix: process.env.STRIPE_REDIS_KEY_PREFIX || 'stripe:pi:',
        ttl: Number(process.env.STRIPE_REDIS_TTL) || 3600,
    },
}));
