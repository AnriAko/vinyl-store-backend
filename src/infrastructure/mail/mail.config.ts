import { registerAs } from '@nestjs/config';

export interface MailConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
}

export default registerAs(
    'mail',
    (): MailConfig => ({
        host: process.env.SMTP_HOST ?? '',
        port: Number(process.env.SMTP_PORT ?? 0),
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
        from: process.env.SMTP_FROM ?? '',
        secure: process.env.SMTP_SECURE === 'true',
    })
);
