import prisma from 'core/database';
import { CommunicationAdapter } from './communication.adapter';

export class TextChatAdapter extends CommunicationAdapter {
    async startSession(processId, payload) {
        const { userId, lawyerId } = payload;
        
        const conversation = await prisma.conversations.create({
            data: {
                user_id: userId,
                lawyer_id: lawyerId,
                context_summary: 'Tư vấn chuyên sâu'
            }
        });

        await prisma.consultation_processes.update({
            where: { id: processId },
            data: { conversation_id: conversation.id }
        });

        return { conversationId: conversation.id };
    }

    async endSession(processId, payload) {
        return { success: true };
    }
}
