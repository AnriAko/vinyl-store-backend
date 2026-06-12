import { registerAs } from '@nestjs/config';

export default registerAs('bcrypt', () => ({
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
}));
