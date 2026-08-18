/* global Blob, FormData */
import axios from 'axios';
import { AI_CHAT_TIMEOUT_MS, AI_SERVICE_BASE_URL, FIS_SERVICE_KEY_ID, FIS_SERVICE_SECRET } from 'core/env';
import { ServiceHmac } from 'core/modules/service-auth';
import { emitAiProgress, emitAiProgressBatch } from './progress-hub';

const DEFAULT_TIMEOUT_MS = 120000;
const LONG_RUNNING_PATHS = new Set([
    '/api/v1/chat',
    '/api/v1/documents/preview',
    '/api/v1/documents/confirm',
    '/api/v1/contracts/extract-docx',
    '/api/v1/contracts/analyze-docx',
    '/api/v1/contracts/analyze-docx-llm',
]);

const FORWARDED_RESPONSE_HEADERS = [
    'content-type',
    'content-disposition',
    'cache-control',
];

const requestTimeout = path => (
    LONG_RUNNING_PATHS.has(path) ? AI_CHAT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS
);

export class AiGatewayServiceClass {
    constructor({ http = axios } = {}) {
        this.http = http;
        this.hmac = null;
    }

    #serviceHmac() {
        if (!this.hmac) {
            this.hmac = new ServiceHmac({
                keyId: FIS_SERVICE_KEY_ID,
                issuer: 'fairinsight-backend',
                audience: 'fairinsight-ai',
                secret: FIS_SERVICE_SECRET,
            });
        }
        return this.hmac;
    }

    #headers(req, path, bodyBuffer, extraHeaders = {}) {
        const headers = { ...extraHeaders };
        if (req.headers.authorization) headers.Authorization = req.headers.authorization;
        if (path === '/api/v1/chat') {
            Object.assign(headers, this.#serviceHmac().sign({
                method: req.method,
                path,
                exactBodyBytes: bodyBuffer || Buffer.alloc(0),
            }));
        }
        return headers;
    }

    #responseHeaders(headers = {}) {
        return Object.fromEntries(
            FORWARDED_RESPONSE_HEADERS
                .filter(key => headers[key])
                .map(key => [key, headers[key]]),
        );
    }

    #clientId(req) {
        const body = req.body || {};
        const query = req.query || {};
        return body.client_id || body.clientId || query.client_id || query.clientId || null;
    }

    #emitFailed(clientId, step, response) {
        const detail = response?.data
            ? Buffer.from(response.data).toString('utf8').slice(0, 300)
            : undefined;
        emitAiProgress(clientId, step, 'error', detail || 'AI request failed');
    }

    async proxyJson(req, targetPath) {
        const path = `/api/v1/${targetPath.replace(/^\/+/, '')}`;
        const rawBody = req.rawBody || (
            ['GET', 'HEAD'].includes(req.method.toUpperCase())
                ? undefined
                : Buffer.from(JSON.stringify(req.body || {}), 'utf8')
        );
        const clientId = this.#clientId(req);
        const isConfirm = path === '/api/v1/documents/confirm';
        if (isConfirm) emitAiProgress(clientId, 'chunk', 'running');
        let response;
        try {
            response = await this.http.request({
                method: req.method,
                url: `${AI_SERVICE_BASE_URL}${path}`,
                params: req.query,
                data: rawBody,
                headers: this.#headers(req, path, rawBody, rawBody ? { 'Content-Type': req.headers['content-type'] || 'application/json' } : {}),
                timeout: requestTimeout(path),
                responseType: 'arraybuffer',
                validateStatus: () => true,
            });
        } catch (error) {
            if (isConfirm) emitAiProgress(clientId, 'chunk', 'error', error.message);
            throw error;
        }
        if (isConfirm) {
            if (response.status >= 400) {
                this.#emitFailed(clientId, 'chunk', response);
            } else {
                emitAiProgressBatch(clientId, [
                    { step: 'chunk', status: 'completed' },
                    { step: 'embed', status: 'completed' },
                    { step: 'store', status: 'completed' },
                ]);
            }
        }
        return {
            status: response.status,
            data: Buffer.from(response.data),
            headers: this.#responseHeaders(response.headers),
        };
    }

    async proxyMultipart(req, targetPath) {
        const path = `/api/v1/${targetPath.replace(/^\/+/, '')}`;
        const clientId = this.#clientId(req);
        const isPreview = path === '/api/v1/documents/preview';
        if (isPreview) {
            emitAiProgressBatch(clientId, [
                { step: 'upload', status: 'completed' },
                { step: 'scan', status: 'running' },
            ]);
        }
        const form = new FormData();
        Object.entries(req.body || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(item => form.append(key, item));
            } else if (value !== undefined && value !== null) {
                form.append(key, value);
            }
        });
        if (req.file) {
            form.append(
                req.file.fieldname,
                new Blob([req.file.buffer], { type: req.file.mimetype }),
                req.file.originalname,
            );
        }
        let response;
        try {
            response = await this.http.request({
                method: req.method,
                url: `${AI_SERVICE_BASE_URL}${path}`,
                params: req.query,
                data: form,
                headers: this.#headers(req, path, null),
                timeout: requestTimeout(path),
                responseType: 'arraybuffer',
                validateStatus: () => true,
            });
        } catch (error) {
            if (isPreview) emitAiProgress(clientId, 'scan', 'error', error.message);
            throw error;
        }
        if (isPreview) {
            if (response.status >= 400) {
                this.#emitFailed(clientId, 'scan', response);
            } else {
                emitAiProgressBatch(clientId, [
                    { step: 'scan', status: 'completed' },
                    { step: 'summarize', status: 'completed' },
                ]);
            }
        }
        return {
            status: response.status,
            data: Buffer.from(response.data),
            headers: this.#responseHeaders(response.headers),
        };
    }
}

export const AiGatewayService = new AiGatewayServiceClass();
