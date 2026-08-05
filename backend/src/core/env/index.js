import env from 'dotenv';

env.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || 'http://localhost:3000';
export const JWT_SECRET = process.env.JWT_SECRET || 'vjppro';
export const EXPIRE_DAYS = process.env.EXPIRE_DAYS || '1d';
export const REFRESH_TOKEN_EXPIRY =
    Number.parseInt(process.env.REFRESH_TOKEN_EXPIRY, 10) || 24 * 60 * 60 * 1000;
export const FORGOT_PASSWORD_TOKEN_EXPIRY =
    Number.parseInt(process.env.FORGOT_PASSWORD_TOKEN_EXPIRY, 10) || 15 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_EXPIRY =
    Number.parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY, 10) || 15 * 60 * 1000;
export const {RESEND_API_KEY} = process.env;
export const {RESEND_FROM} = process.env;
export const { DATABASE_URL } = process.env;
export const ROOT_DIR =
    process.env === 'production'
        ? `${process.cwd()}/dist`
        : `${process.cwd()}/src`;
export const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_TYPE } =
    process.env;
export const SALT_ROUNDS = Number.parseInt(process.env.SALT_ROUNDS, 10);
export const { SENTRY_DSN, DISCORD_WEBHOOK, DISCORD_BOT_NAME, DISCORD_BOT_AVATAR_URL, CORS_ALLOW } = process.env;
export const BILLING_MODE = process.env.BILLING_MODE || 'SHADOW';
export const CHAT_GATEWAY_ENABLED = process.env.CHAT_GATEWAY_ENABLED !== 'false';
export const TOPUP_ENABLED = process.env.TOPUP_ENABLED === 'true';
export const ENTERPRISE_ENABLED = process.env.ENTERPRISE_ENABLED === 'true';
export const {FIS_SERVICE_KEY_ID} = process.env;
export const {FIS_SERVICE_SECRET} = process.env;
export const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000';
export const AI_CHAT_TIMEOUT_MS = Number.parseInt(process.env.AI_CHAT_TIMEOUT_MS, 10) || 930000;
export const DISCORD = {
    WEBHOOK: DISCORD_WEBHOOK,
    BOT_NAME: DISCORD_BOT_NAME,
    BOT_AVATAR_URL: DISCORD_BOT_AVATAR_URL,
};
