import test from 'node:test';
import { expect } from '~/__tests__/test-utils/expect-util';
import { MailService } from '~/infrastructure/mail/mail.service';

class MockMailerService {
    sendMailCalledWith: any = null;
    shouldFail = false;

    async sendMail(options: any) {
        this.sendMailCalledWith = options;
        if (this.shouldFail) throw new Error('SMTP error');
        return true;
    }
}

test('MailService.sendMail succeeds', async () => {
    const mockMailer = new MockMailerService();
    const mailService = new MailService(mockMailer as any);

    const result = await mailService.sendMail(
        'user@example.com',
        'Test Subject',
        'Test text',
        '<p>HTML content</p>'
    );

    expect(result.success).toBe(true);
    expect(mockMailer.sendMailCalledWith.to).toBe('user@example.com');
    expect(mockMailer.sendMailCalledWith.subject).toBe('Test Subject');
    expect(mockMailer.sendMailCalledWith.text).toBe('Test text');
    expect(mockMailer.sendMailCalledWith.html).toBe('<p>HTML content</p>');
});

test('MailService.sendMail fails and logs error', async () => {
    const mockMailer = new MockMailerService();
    mockMailer.shouldFail = true;
    const mailService = new MailService(mockMailer as any);

    let loggedError: any = null;
    const originalConsoleError = console.error;
    console.error = (_msg: string, err: any) => {
        loggedError = err;
    };

    const result = await mailService.sendMail(
        'fail@example.com',
        'Fail Subject',
        'Fail text'
    );

    expect(result.success).toBe(false);
    expect(loggedError).toBeInstanceOf(Error);
    expect(loggedError.message).toBe('SMTP error');

    console.error = originalConsoleError;
});

test('MailService.sendTemplateMail succeeds', async () => {
    const mockMailer = new MockMailerService();
    const mailService = new MailService(mockMailer as any);

    const result = await mailService.sendTemplateMail(
        'user2@example.com',
        'Template Subject',
        'template-name',
        { name: 'John' }
    );

    expect(result.success).toBe(true);
    expect(mockMailer.sendMailCalledWith.to).toBe('user2@example.com');
    expect(mockMailer.sendMailCalledWith.subject).toBe('Template Subject');
    expect(mockMailer.sendMailCalledWith.template).toBe('template-name');
    expect(mockMailer.sendMailCalledWith.context).toEqual({ name: 'John' });
});

test('MailService.sendTemplateMail fails and logs error', async () => {
    const mockMailer = new MockMailerService();
    mockMailer.shouldFail = true;
    const mailService = new MailService(mockMailer as any);

    let loggedError: any = null;
    const originalConsoleError = console.error;
    console.error = (_msg: string, err: any) => {
        loggedError = err;
    };

    const result = await mailService.sendTemplateMail(
        'fail2@example.com',
        'Fail Template',
        'template-fail',
        {}
    );

    expect(result.success).toBe(false);
    expect(loggedError).toBeInstanceOf(Error);
    expect(loggedError.message).toBe('SMTP error');

    console.error = originalConsoleError;
});
