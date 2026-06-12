import { registerAs } from '@nestjs/config';

export default registerAs('googleOAuth', () => ({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURI: process.env.GOOGLE_CALLBACK_URI,
    adminCallbackURI: process.env.GOOGLE_ADMIN_CALLBACK_URI,
}));
