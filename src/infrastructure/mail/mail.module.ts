import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mailConfig from '~/infrastructure/mail/mail.config';
import { MailService } from '~/infrastructure/mail/mail.service';

@Module({
    imports: [
        ConfigModule.forFeature(mailConfig),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const mail = config.get('mail');
                return {
                    transport: {
                        host: mail.host,
                        port: mail.port,
                        secure: mail.secure,
                        auth: {
                            user: mail.user,
                            pass: mail.pass,
                        },
                    },
                    defaults: {
                        from: mail.from,
                    },
                };
            },
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
