import { Server } from 'socket.io';
import { logger } from '../packages/logger';

let io;

export const initSocket = server => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        }
    });

    io.on('connection', socket => {
        logger.info(`Socket connected: ${socket.id}`);

        socket.on('join_process', processId => {
            socket.join(processId);
            logger.info(`Socket ${socket.id} joined room: ${processId}`);
        });

        // WebRTC Signaling
        socket.on('call_user', ({ roomId, callType }) => {
            socket.to(roomId).emit('call_incoming', { callType });
        });

        socket.on('accept_call', ({ roomId }) => {
            socket.to(roomId).emit('call_accepted');
        });

        socket.on('webrtc_offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('webrtc_offer', { offer });
        });

        socket.on('webrtc_answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('webrtc_answer', { answer });
        });

        socket.on('webrtc_ice_candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('webrtc_ice_candidate', { candidate });
        });

        socket.on('end_call', ({ roomId }) => {
            socket.to(roomId).emit('end_call');
        });

        socket.on('update_board_notes', ({ roomId, notes }) => {
            socket.to(roomId).emit('board_notes_updated', { notes });
        });

        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIo = () => io;

export const emitToRoom = (roomId, event, data) => {
    if (io && roomId) {
        io.to(roomId).emit(event, data);
    }
};
