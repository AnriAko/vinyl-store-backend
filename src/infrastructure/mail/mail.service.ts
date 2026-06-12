import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) {}

    async sendMail(to: string, subject: string, text: string, html?: string) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                text,
                html,
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }
    }

    async sendTemplateMail(
        to: string,
        subject: string,
        template: string,
        context: Record<string, any>
    ) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                template,
                context,
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending template email:', error);
            return { success: false, error };
        }
    }
}
