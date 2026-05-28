import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from 'core/env';
import { InternalServerException } from 'packages/httpException';
import { logger } from 'packages/logger';

class Service {
    constructor() {
        const secure = SMTP_PORT === 465;

        this.transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }

    async send({ to, subject, text, html }) {
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
            throw new InternalServerException('Mail service is not configured');
        }

        try {
            await this.transporter.sendMail({
                from: SMTP_FROM,
                to,
                subject,
                text,
                html,
            });
        } catch (error) {
            logger.error(`[MailerService] ${error.message}`);
            throw new InternalServerException('Failed to send email');
        }
    }
}

export const MailerService = new Service();
