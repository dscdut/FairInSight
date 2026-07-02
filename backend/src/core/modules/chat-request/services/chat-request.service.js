import prisma from 'core/database';
import { NotFoundException, InternalServerException, BadRequestException } from 'packages/httpException';

class Service {
    async createChatRequest(userId, payload) {
        try {
            let { lawyerId } = payload;
            const { analysisId } = payload;

            // Verify user exists
            const userExists = await prisma.users.findFirst({
                where: { id: userId, deleted_at: null }
            });
            if (!userExists) {
                throw new NotFoundException(`User with ID "${userId}" not found. Please log out and log in again.`);
            }

            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (lawyerId && !uuidRegex.test(lawyerId)) {
                // Resolve mock lawyer ID to a real database lawyer UUID if needed
                const allLawyers = await prisma.users.findMany({
                    where: {
                        deleted_at: null,
                        roles: { name: 'LAWYER' },
                        lawyer_details: { is_verified: true }
                    },
                    orderBy: { created_at: 'asc' }
                });
                if (allLawyers.length > 0) {
                    const match = lawyerId.match(/lyr-(\d+)/);
                    if (match) {
                        const index = parseInt(match[1], 10) - 1;
                        const selectedLawyer = allLawyers[index % allLawyers.length];
                        lawyerId = selectedLawyer.id;
                    } else {
                        lawyerId = allLawyers[0].id;
                    }
                }
            }

            if (!lawyerId || !uuidRegex.test(lawyerId)) {
                throw new NotFoundException(`Lawyer with ID "${lawyerId}" not found`);
            }

            // Verify lawyer exists
            const lawyer = await prisma.users.findFirst({
                where: { id: lawyerId, roles: { name: 'LAWYER' }, deleted_at: null }
            });
            if (!lawyer) {
                throw new NotFoundException(`Lawyer with ID "${lawyerId}" not found`);
            }

            // Verify analysis exists if provided
            let finalAnalysisId = null;
            if (analysisId) {
                if (uuidRegex.test(analysisId)) {
                    const analysis = await prisma.analysis.findFirst({
                        where: { id: analysisId, user_id: userId, deleted_at: null }
                    });
                    if (!analysis) {
                        throw new NotFoundException(`Analysis report with ID "${analysisId}" not found`);
                    }
                    finalAnalysisId = analysisId;
                } else {
                    console.warn(`Non-UUID analysis ID provided: "${analysisId}". Treating as mock.`);
                }
            }

            return await prisma.chat_requests.create({
                data: {
                    user_id: userId,
                    lawyer_id: lawyerId,
                    analysis_id: finalAnalysisId,
                    status: 'PENDING'
                }
            });
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }

    async getReceivedRequests(lawyerId) {
        try {
            return await prisma.chat_requests.findMany({
                where: {
                    lawyer_id: lawyerId,
                    deleted_at: null
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            avatar_url: true
                        }
                    },
                    analysis: {
                        select: {
                            id: true,
                            context_summary: true,
                            result: true,
                            input_data: true,
                            created_at: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
        } catch (error) {
            throw new InternalServerException(error.message);
        }
    }

    async getSentRequests(userId) {
        try {
            return await prisma.chat_requests.findMany({
                where: {
                    user_id: userId,
                    deleted_at: null
                },
                include: {
                    lawyer_details: {
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    full_name: true,
                                    email: true,
                                    avatar_url: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
        } catch (error) {
            throw new InternalServerException(error.message);
        }
    }

    async updateRequestStatus(id, lawyerId, payload) {
        try {
            const { status, proposedDate, rescheduleReason, adviceSummary } = payload;

            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (!id || !uuidRegex.test(id)) {
                throw new NotFoundException(`Chat request with ID "${id}" not found`);
            }

            const request = await prisma.chat_requests.findFirst({
                where: { id, lawyer_id: lawyerId, deleted_at: null }
            });
            if (!request) {
                throw new NotFoundException(`Chat request with ID "${id}" not found`);
            }

            const updatedData = {
                status,
                updated_at: new Date()
            };

            if (status === 'RESCHEDULED') {
                if (!proposedDate) {
                    throw new BadRequestException('proposedDate is required for RESCHEDULED status');
                }
                updatedData.proposed_date = new Date(proposedDate);
                updatedData.reschedule_reason = rescheduleReason || null;
            }

            if (status === 'COMPLETED' && adviceSummary) {
                updatedData.advice_summary = adviceSummary;
            }

            const updatedRequest = await prisma.chat_requests.update({
                where: { id },
                data: updatedData
            });

            // If ACCEPTED, automatically create a conversation and update/create consultation process
            if (status === 'ACCEPTED') {
                const newConv = await prisma.conversations.create({
                    data: {
                        user_id: request.user_id,
                        lawyer_id: request.lawyer_id,
                        context_summary: 'Tư vấn chuyên sâu'
                    }
                });
                const conversationId = newConv.id;

                // Check for existing consultation process
                const consultation = await prisma.consultation_processes.findFirst({
                    where: {
                        user_id: request.user_id,
                        lawyer_id: request.lawyer_id,
                        analysis_id: request.analysis_id,
                        deleted_at: null
                    }
                });

                if (consultation) {
                    await prisma.consultation_processes.update({
                        where: { id: consultation.id },
                        data: {
                            current_stage: 'CHATTING',
                            conversation_id: conversationId
                        }
                    });
                } else {
                    await prisma.consultation_processes.create({
                        data: {
                            user_id: request.user_id,
                            lawyer_id: request.lawyer_id,
                            analysis_id: request.analysis_id,
                            current_stage: 'CHATTING',
                            conversation_id: conversationId
                        }
                    });
                }
            }

            return updatedRequest;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new InternalServerException(error.message);
        }
    }
}

export const ChatRequestService = new Service();
