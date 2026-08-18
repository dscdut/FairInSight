import { WebSocketServer, WebSocket } from 'ws';
import { logger } from 'packages/logger';

const clients = new Map();

const PROGRESS_PREFIXES = [
    '/api/v1/legal-corpus/ws/progress/',
    '/api/v1/ai/ws/progress/',
];

const parseClientId = url => {
    try {
        const { pathname } = new URL(url || '', 'http://localhost');
        const prefix = PROGRESS_PREFIXES.find(item => pathname.startsWith(item));
        if (!prefix) return null;
        const clientId = decodeURIComponent(pathname.slice(prefix.length)).trim();
        return /^[a-zA-Z0-9._:-]{1,128}$/.test(clientId) ? clientId : null;
    } catch {
        return null;
    }
};

const removeClient = (clientId, ws) => {
    const set = clients.get(clientId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) clients.delete(clientId);
};

export const initAiProgressWebSocket = server => {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        const clientId = parseClientId(req.url);
        if (!clientId) return;
        wss.handleUpgrade(req, socket, head, ws => {
            wss.emit('connection', ws, req, clientId);
        });
    });

    wss.on('connection', (ws, req, clientId) => {
        const set = clients.get(clientId) || new Set();
        set.add(ws);
        clients.set(clientId, set);
        logger.info(`AI progress socket connected: ${clientId}`);

        ws.send(JSON.stringify({
            type: 'connected',
            client_id: clientId,
            timestamp: new Date().toISOString(),
        }));

        ws.on('close', () => removeClient(clientId, ws));
        ws.on('error', () => removeClient(clientId, ws));
    });

    return wss;
};

export const emitAiProgress = (clientId, step, status, error = undefined) => {
    if (!clientId) return;
    const set = clients.get(clientId);
    if (!set?.size) return;

    const payload = JSON.stringify({
        step,
        status,
        error,
        client_id: clientId,
        timestamp: new Date().toISOString(),
    });

    set.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
};

export const emitAiProgressBatch = (clientId, events) => {
    events.forEach(event => emitAiProgress(clientId, event.step, event.status, event.error));
};
