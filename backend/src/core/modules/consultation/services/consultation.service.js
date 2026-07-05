import prisma from 'core/database';
import { NotFoundException, BadRequestException, ForbiddenException } from 'packages/httpException';
import { emitToRoom } from 'core/socket';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_TYPE } from 'core/env';
import { TextChatAdapter } from '../adapters/text-chat.adapter';

class Service {
    async listConsultations(userId) {
        return prisma.consultation_processes.findMany({
            where: {
                OR: [
                    { user_id: userId },
                    { lawyer_id: userId }
                ],
                deleted_at: null
            },
            include: {
                users: {
                    select: { id: true, full_name: true, email: true, avatar_url: true }
                },
                lawyer_details: {
                    include: {
                        users: {
                            select: { id: true, full_name: true, email: true, avatar_url: true }
                        }
                    }
                },
                conversations: {
                    include: {
                        messages: {
                            orderBy: { created_at: 'asc' }
                        }
                    }
                },
                analysis: {
                    select: { id: true, context_summary: true, result: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async createConsultation(userId, payload) {
        let { lawyerId } = payload;
        const { analysisId, contextSummary, message } = payload;

        // Verify user exists
        const userExists = await prisma.users.findFirst({
            where: { id: userId, deleted_at: null }
        });
        if (!userExists) {
            throw new NotFoundException(`User with ID "${userId}" not found. Please log out and log in again.`);
        }

        // Resolve mock lawyer ID to a real database lawyer UUID if needed
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (lawyerId && !uuidRegex.test(lawyerId)) {
            const allLawyers = await prisma.lawyer_details.findMany({
                where: { deleted_at: null },
                orderBy: { created_at: 'asc' }
            });
            if (allLawyers.length > 0) {
                const match = lawyerId.match(/lyr-(\d+)/);
                if (match) {
                    const index = parseInt(match[1], 10) - 1;
                    const selectedLawyer = allLawyers[index % allLawyers.length];
                    lawyerId = selectedLawyer.user_id;
                } else {
                    lawyerId = allLawyers[0].user_id;
                }
            }
        }

        // Verify lawyer details exist
        const lawyer = await prisma.lawyer_details.findFirst({
            where: { user_id: lawyerId, deleted_at: null }
        });
        if (!lawyer) {
            throw new NotFoundException(`Lawyer with ID "${lawyerId}" not found`);
        }

        // Verify analysis report if provided
        let validAnalysisId = null;
        if (analysisId) {
            if (uuidRegex.test(analysisId)) {
                const analysis = await prisma.analysis.findFirst({
                    where: { id: analysisId, user_id: userId, deleted_at: null }
                });
                if (!analysis) {
                    throw new NotFoundException(`Analysis report with ID "${analysisId}" not found`);
                }
                validAnalysisId = analysisId;
            } else if (analysisId.startsWith('ana-')) {
                // Mock report handler: Dynamically create analysis database record
                let context_summary = 'Tư vấn chuyên sâu';
                let result = '';

                if (analysisId === 'ana-1082') {
                    context_summary = 'Tranh chấp hợp đồng đặt cọc nhà đất';
                    result = '### BẢN PHÂN TÍCH PHÁP LÝ\n**Chủ đề:** Tranh chấp hợp đồng đặt cọc mua bán nhà đất\n**Ngày lập:** 29/06/2026\n\n#### 1. Căn cứ pháp lý áp dụng\n- Bộ luật Dân sự 2015 (Điều 328 về Đặt cọc).\n- Luật Đất đai và các văn bản hướng dẫn thi hành.\n\n#### 2. Nhận định tình huống\n- Bên mua đã giao tiền đặt cọc đúng hạn và có biên nhận hợp lệ.\n- Bên bán đơn phương hủy bỏ giao dịch mà không có lý do bất khả kháng.\n\n#### 3. Khuyến nghị giải quyết\n- **Khởi kiện:** Yêu cầu bên bán trả lại tiền đặt cọc và phạt cọc tương đương giá trị đặt cọc theo quy định tại Khoản 2 Điều 328 BLDS 2015.\n- **Thương lượng:** Đề xuất mức bồi thường phù hợp trước khi đưa ra tòa án để tiết kiệm thời gian và chi phí.';
                } else if (analysisId === 'ana-1095') {
                    context_summary = 'Đơn phương ly hôn có yếu tố nước ngoài';
                    result = '### BẢN PHÂN TÍCH PHÁP LÝ\n**Chủ đề:** Đơn phương ly hôn có yếu tố nước ngoài\n**Ngày lập:** 28/06/2026\n\n#### 1. Căn cứ pháp lý áp dụng\n- Luật Hôn nhân và Gia đình 2014.\n- Bộ luật Tố tụng Dân sự 2015.\n\n#### 2. Nhận định tình huống\n- Người chồng đã đi nước ngoài hơn 2 năm, gia đình không liên lạc được và không rõ địa chỉ cụ thể hiện tại.\n- Thẩm quyền giải quyết thuộc Tòa án nhân dân cấp Tỉnh.\n\n#### 3. Các bước thực hiện\n1. Nộp đơn yêu cầu thông báo tìm kiếm người vắng mặt tại nơi cư trú.\n2. Nộp đơn xin ly hôn đơn phương kèm chứng cứ chứng minh mâu thuẫn gia đình.\n3. Thực hiện thủ tục niêm yết công khai theo quy định tố tụng dân sự.';
                }

                const newAnalysis = await prisma.analysis.create({
                    data: {
                        user_id: userId,
                        context_summary,
                        result,
                        input_data: { question: context_summary }
                    }
                });
                validAnalysisId = newAnalysis.id;
            } else {
                console.warn(`Non-UUID analysisId "${analysisId}" provided. Setting database field to null.`);
            }
        } else if (contextSummary || message) {
            // Create a new analysis record based on manual user description inputs
            const newAnalysis = await prisma.analysis.create({
                data: {
                    user_id: userId,
                    context_summary: contextSummary || 'Yêu cầu tư vấn tự chọn',
                    result: message || 'Chưa cung cấp nội dung.',
                    input_data: { question: message || '' }
                }
            });
            validAnalysisId = newAnalysis.id;
        }

        const consultation = await prisma.consultation_processes.create({
            data: {
                user_id: userId,
                lawyer_id: lawyerId,
                analysis_id: validAnalysisId,
                current_stage: 'PENDING'
            },
            include: {
                users: {
                    select: { id: true, full_name: true, email: true, avatar_url: true }
                },
                lawyer_details: {
                    include: {
                        users: {
                            select: { id: true, full_name: true, email: true, avatar_url: true }
                        }
                    }
                }
            }
        });

        // Auto-create matching chat_requests record to synchronize with Lawyer Dashboard and Appointments screens
        try {
            await prisma.chat_requests.create({
                data: {
                    user_id: userId,
                    lawyer_id: lawyerId,
                    analysis_id: validAnalysisId,
                    status: 'PENDING'
                }
            });
        } catch (err) {
            console.error('Failed to auto-create matching chat request:', err);
        }

        return consultation;
    }

    async getConsultation(userId, id) {
        const process = await prisma.consultation_processes.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, full_name: true, email: true, avatar_url: true }
                },
                lawyer_details: {
                    include: {
                        users: {
                            select: { id: true, full_name: true, email: true, avatar_url: true }
                        }
                    }
                },
                conversations: {
                    include: {
                        messages: {
                            orderBy: { created_at: 'asc' }
                        }
                    }
                },
                call_sessions: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!process) {
            throw new NotFoundException(`Consultation process with ID "${id}" not found`);
        }

        // Verify access: user or lawyer
        if (process.user_id !== userId && process.lawyer_id !== userId) {
            throw new ForbiddenException('You do not have permission to view this consultation');
        }

        return process;
    }

    async getConsultationByAnalysis(userId, analysisId) {
        if (!analysisId) return null;
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(analysisId)) {
            console.warn(`Non-UUID analysisId provided: "${analysisId}". Returning null for process check.`);
            return null;
        }

        return prisma.consultation_processes.findFirst({
            where: {
                analysis_id: analysisId,
                OR: [
                    { user_id: userId },
                    { lawyer_id: userId }
                ],
                deleted_at: null
            },
            include: {
                users: {
                    select: { id: true, full_name: true, email: true, avatar_url: true }
                },
                lawyer_details: {
                    include: {
                        users: {
                            select: { id: true, full_name: true, email: true, avatar_url: true }
                        }
                    }
                },
                conversations: {
                    include: {
                        messages: {
                            orderBy: { created_at: 'asc' }
                        }
                    }
                },
                call_sessions: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
    }

    async cancelConsultation(userId, id) {
        const process = await this.getConsultation(userId, id);
        if (process.current_stage !== 'PENDING' && process.current_stage !== 'CHATTING') {
            throw new BadRequestException('Only pending or chatting consultation requests can be cancelled/rejected');
        }
        const result = await prisma.consultation_processes.update({
            where: { id },
            data: { current_stage: 'REJECTED' }
        });
        emitToRoom(id, 'process_updated', result);
        return result;
    }

    async updateStage(userId, id, payload) {
        const { stage } = payload;
        const process = await this.getConsultation(userId, id);

        const isLawyer = process.lawyer_id === userId;

        // Custom transition logics
        if (stage === 'CHATTING' && process.current_stage === 'PENDING') {
            if (!isLawyer) {
                throw new ForbiddenException('Only the lawyer can accept the consultation request');
            }
            // Trigger chat communication adapter to establish conversation
            const adapter = new TextChatAdapter();
            await adapter.startSession(id, { userId: process.user_id, lawyerId: process.lawyer_id });
        }

        // Define stage order to check if target stage is a revert
        const stageOrder = ['PENDING', 'CHATTING', 'PDF_GENERATION', 'PORTAL_SUBMITTING', 'COMPLETED', 'REVIEWED'];
        const currentIdx = stageOrder.indexOf(process.current_stage);
        const targetIdx = stageOrder.indexOf(stage);

        let updateData = { current_stage: stage };

        if (targetIdx !== -1 && currentIdx !== -1 && targetIdx < currentIdx) {
            // Revert detected: clear subsequent stage data based on target stage
            if (stage === 'PENDING' || stage === 'CHATTING') {
                updateData = {
                    ...updateData,
                    template_id: null,
                    template_status: null,
                    template_data: null,
                    pdf_url: null,
                    advice_summary: null,
                    submission_method: null,
                    portal_status: null,
                    portal_feedback: null,
                    rating: null,
                    review_comment: null
                };
            } else if (stage === 'PDF_GENERATION') {
                updateData = {
                    ...updateData,
                    template_status: 'SELECTED', // let client fill form again
                    pdf_url: null,               // reset generated PDF
                    advice_summary: null,        // reset lawyer advice
                    submission_method: null,
                    portal_status: null,
                    portal_feedback: null,
                    rating: null,
                    review_comment: null
                };
            } else if (stage === 'PORTAL_SUBMITTING') {
                updateData = {
                    ...updateData,
                    portal_status: 'PENDING',
                    portal_feedback: null,
                    rating: null,
                    review_comment: null
                };
            } else if (stage === 'COMPLETED') {
                updateData = {
                    ...updateData,
                    rating: null,
                    review_comment: null
                };
            }
        }

        const result = await prisma.consultation_processes.update({
            where: { id },
            data: updateData,
            include: { conversations: true }
        });
        emitToRoom(id, 'process_updated', result);
        return result;
    }

    async skipStage(userId, id, payload) {
        const { targetStage } = payload;
        // Transition check
        const validStages = ['PENDING', 'CHATTING', 'PDF_GENERATION', 'PORTAL_SUBMITTING', 'COMPLETED', 'REVIEWED'];
        if (!validStages.includes(targetStage)) {
            throw new BadRequestException(`Invalid target stage "${targetStage}"`);
        }

        const result = await prisma.consultation_processes.update({
            where: { id },
            data: { current_stage: targetStage }
        });
        emitToRoom(id, 'process_updated', result);
        return result;
    }

    async selectTemplate(userId, id, templateId) {
        const process = await prisma.consultation_processes.findUnique({ where: { id } });
        if (!process) throw new NotFoundException('Process not found');
        const result = await prisma.consultation_processes.update({
            where: { id },
            data: {
                template_id: templateId,
                template_status: 'SELECTED'
            }
        });
        emitToRoom(id, 'process_updated', result);
        return result;
    }

    async submitTemplateData(userId, id, templateData) {
        const process = await prisma.consultation_processes.findUnique({ where: { id } });
        if (!process) throw new NotFoundException('Process not found');

        // 1. Update template data first
        await prisma.consultation_processes.update({
            where: { id },
            data: {
                template_data: templateData,
                template_status: 'SUBMITTED'
            }
        });

        // 2. Render and upload PDF
        let pdfUrl = null;
        try {
            pdfUrl = await this._generateAndUploadPdf(id);
        } catch (err) {
            console.error('PDF generation on submitTemplateData failed:', err);
        }

        // 3. Save PDF URL
        const result = await prisma.consultation_processes.update({
            where: { id },
            data: {
                pdf_url: pdfUrl || undefined
            }
        });

        emitToRoom(id, 'process_updated', result);
        return result;
    }

    async submitPdf(userId, id, payload) {
        const { adviceSummary, submissionMethod } = payload;
        const process = await this.getConsultation(userId, id);

        if (process.lawyer_id !== userId) {
            throw new ForbiddenException('Only the assigned lawyer can write advice and submit report');
        }

        const nextStage = 'PORTAL_SUBMITTING';

        // 1. Update advice summary and stage first
        await prisma.consultation_processes.update({
            where: { id },
            data: {
                advice_summary: adviceSummary,
                submission_method: submissionMethod,
                current_stage: nextStage,
                portal_status: 'PENDING'
            }
        });

        // 2. Render and upload final PDF with lawyer advice and signature
        let pdfUrl = null;
        try {
            pdfUrl = await this._generateAndUploadPdf(id);
        } catch (err) {
            console.error('PDF generation on submitPdf failed:', err);
        }

        // 3. Save PDF URL
        const result = await prisma.consultation_processes.update({
            where: { id },
            data: {
                pdf_url: pdfUrl || undefined
            }
        });

        emitToRoom(id, 'process_updated', result);
        return result;
    }

    async mockPortalCallback(id, payload) {
        const { status, feedback } = payload || {};
        const process = await prisma.consultation_processes.findUnique({
            where: { id }
        });
        if (!process) {
            throw new NotFoundException(`Consultation with ID "${id}" not found`);
        }

        const result = await prisma.consultation_processes.update({
            where: { id },
            data: {
                portal_status: status || 'APPROVED',
                portal_feedback: feedback || null,
                current_stage: 'COMPLETED'
            }
        });
        emitToRoom(id, 'process_updated', result);
        return result;
    }

    async submitReview(userId, id, payload) {
        const { rating, reviewComment } = payload;
        const process = await this.getConsultation(userId, id);

        if (process.user_id !== userId) {
            throw new ForbiddenException('Only the client can rate the lawyer');
        }

        // Update process status
        const updatedProcess = await prisma.consultation_processes.update({
            where: { id },
            data: {
                rating: Number(rating),
                review_comment: reviewComment,
                current_stage: 'REVIEWED'
            }
        });

        // Recalculate lawyer's rating average
        const allRatings = await prisma.consultation_processes.findMany({
            where: {
                lawyer_id: process.lawyer_id,
                current_stage: 'REVIEWED',
                rating: { not: null }
            },
            select: { rating: true }
        });

        const ratingsCount = allRatings.length;
        const ratingSum = allRatings.reduce((sum, item) => sum + item.rating, 0);
        const ratingAvg = ratingsCount > 0 ? Number((ratingSum / ratingsCount).toFixed(2)) : 0;

        await prisma.lawyer_details.update({
            where: { user_id: process.lawyer_id },
            data: { rating_avg: ratingAvg }
        });

        emitToRoom(id, 'process_updated', updatedProcess);
        return updatedProcess;
    }

    async sendMessage(userId, id, payload) {
        const { content } = payload;
        const process = await this.getConsultation(userId, id);

        let conversationId = process.conversation_id;
        if (!conversationId) {
            const conversation = await prisma.conversations.create({
                data: {
                    user_id: process.user_id,
                    lawyer_id: process.lawyer_id,
                    context_summary: process.analysis?.context_summary || 'Tư vấn chuyên sâu'
                }
            });

            conversationId = conversation.id;
            await prisma.consultation_processes.update({
                where: { id },
                data: { conversation_id: conversationId }
            });
        }

        const message = await prisma.messages.create({
            data: {
                conversation_id: conversationId,
                sender_id: userId,
                content
            }
        });

        emitToRoom(id, 'message_received', message);
        emitToRoom(id, 'process_updated');
        return message;
    }

    async _generateAndUploadPdf(id) {
        const consultationProcess = await prisma.consultation_processes.findUnique({
            where: { id },
            include: {
                users: true,
                lawyer_details: {
                    include: { users: true }
                },
                analysis: true
            }
        });
        if (!consultationProcess || !consultationProcess.template_id) return null;

        const template = await prisma.templates.findUnique({
            where: { id: consultationProcess.template_id }
        });
        if (!template) return null;

        let htmlContent = '';
        const fileNameMap = {
            'd3b07384-d113-4c9f-a2e6-ebcd2a2f8c5b': 'hop_dong_nhuong_quyen.html',
            'cf401a02-d224-4f8e-a3f7-fbcd3a3f9c6c': 'cf401a_02_dntn.html',
            'e4c01b03-d335-4f9e-b4f8-abcd4a4f0d7d': 'hop_dong_thue_van_phong.html'
        };
        const localFileName = fileNameMap[consultationProcess.template_id];
        const localFilePath = localFileName ? path.join(process.cwd(), '../templates', localFileName) : null;
        if (localFilePath && fs.existsSync(localFilePath)) {
            htmlContent = fs.readFileSync(localFilePath, 'utf8');
        } else {
            try {
                const response = await axios.get(template.file_url);
                htmlContent = response.data;
            } catch (err) {
                console.warn('Failed to fetch template from cloudinary, using fallback skeleton:', err.message);
                htmlContent = `
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <style>
                        body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .title { font-weight: bold; font-size: 16px; margin-bottom: 20px; text-transform: uppercase; text-align: center; }
                        .field-row { margin-bottom: 8px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                        <h5>Độc lập - Tự do - Hạnh phúc</h5>
                      </div>
                      <div class="title">{{ templateTitle }}</div>
                      <div id="fields"></div>
                    </body>
                  </html>
                `;
            }
        }

        const data = {
            templateTitle: template.name,
            ...(consultationProcess.template_data || {})
        };

        let renderedHtml = htmlContent;
        Object.keys(data).forEach(key => {
            const value = data[key];
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            renderedHtml = renderedHtml.replace(regex, value || '');
        });
        renderedHtml = renderedHtml.replace(/{{\s*[\w\d_]+\s*}}/g, '');



        const launchOptions = {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };
        if (process.env.CHROME_BIN) {
            launchOptions.executablePath = process.env.CHROME_BIN;
        }
        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            }
        });
        await browser.close();

        const uploadPdfBuffer = (buffer, options) => new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
            stream.write(buffer);
            stream.end();
        });

        const uploadResult = await uploadPdfBuffer(pdfBuffer, {
            folder: 'consultations',
            resource_type: 'raw',
            format: 'pdf',
            type: CLOUDINARY_TYPE || 'upload'
        });

        return uploadResult.secure_url;
    }
}

export default new Service();
