import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM } from 'core/env';
import { InternalServerException } from 'packages/httpException';
import { logger } from 'packages/logger';

class Service {
    constructor() {
        this.client = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
    }

    async send({ to, subject, text, html }) {
        if (!this.client || !RESEND_FROM) {
            throw new InternalServerException('Mail service is not configured');
        }

        try {
            const { error } = await this.client.emails.send({
                from: RESEND_FROM,
                to,
                subject,
                text,
                html,
            });

            if (error) {
                logger.error(`[MailerService] ${error.message || 'Resend error'}`);
                throw new InternalServerException('Failed to send email');
            }
        } catch (error) {
            logger.error(`[MailerService] ${error.message}`);
            throw new InternalServerException('Failed to send email');
        }
    }
}

export const MailerService = new Service();
