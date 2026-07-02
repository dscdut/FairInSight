import { io, type Socket } from 'socket.io-client';

import config from '@/core/configs/env';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    let socketUrl = config.baseUrl;
    try {
      const url = new URL(config.baseUrl);
      socketUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      socketUrl = config.baseUrl.replace('/api/v1', '').replace('/api', '');
    }
    socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};
