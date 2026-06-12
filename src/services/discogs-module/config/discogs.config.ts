import { registerAs } from '@nestjs/config';

export default registerAs('discogs', () => ({
    token: process.env.DISCOGS_TOKEN || '',
}));
