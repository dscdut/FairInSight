import prisma from 'core/database';
import { CommunicationAdapter } from './communication.adapter';

export class CallAdapter extends CommunicationAdapter {
    constructor(channel) {
        super();
        this.channel = channel; // 'VOICE_CALL' or 'VIDEO_CALL'
    }

    async startSession(processId) {
        const callSession = await prisma.call_sessions.create({
            data: {
                process_id: processId,
                channel: this.channel,
                started_at: new Date(),
                session_metadata: { roomName: `room-${processId}-${Date.now()}` }
            }
        });
        return { callSessionId: callSession.id, roomName: callSession.session_metadata.roomName };
    }

    async endSession(processId, payload) {
        const { callSessionId } = payload;
        if (!callSessionId) return { success: false };

        const endedAt = new Date();
        const callSession = await prisma.call_sessions.findUnique({
            where: { id: callSessionId }
        });

        if (callSession) {
            const diffMs = endedAt - new Date(callSession.started_at);
            const durationSec = Math.floor(diffMs / 1000);
            await prisma.call_sessions.update({
                where: { id: callSessionId },
                data: {
                    ended_at: endedAt,
                    duration_sec: durationSec
                }
            });
        }
        return { success: true };
    }
}
