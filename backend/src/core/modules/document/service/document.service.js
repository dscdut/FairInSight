import prisma from 'core/database';
import { NotFoundException, InternalServerException } from 'packages/httpException';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_TYPE } from 'core/env';

const uploadPdfBuffer = (buffer, options) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
    });
    stream.write(buffer);
    stream.end();
});

class Service {
    async createOrUpdateDocument(userId, { templateId, content, fileUrl, isDraft, documentId, html }) {
        try {
            let pdfUrl = fileUrl || null;

            if (!isDraft && html) {
                try {
                    const browser = await puppeteer.launch({
                        headless: 'new',
                        executablePath: process.env.CHROME_BIN,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                    const page = await browser.newPage();
                    await page.setContent(html, { waitUntil: 'networkidle0' });
                    const pdfBuffer = await page.pdf({
                        format: 'A4',
                        printBackground: true,
                        margin: {
                            top: '15mm',
                            bottom: '15mm',
                            left: '15mm',
                            right: '15mm'
                        }
                    });
                    await browser.close();

                    const uploadResult = await uploadPdfBuffer(pdfBuffer, {
                        folder: 'documents',
                        resource_type: 'raw',
                        type: CLOUDINARY_TYPE || 'upload'
                    });
                    pdfUrl = uploadResult.secure_url;
                } catch (pdfError) {
                    console.error('PDF Generation/Upload failed:', pdfError);
                    throw new InternalServerException(`PDF Generation/Upload failed: ${pdfError.message}`);
                }
            }

            if (documentId) {
                const existing = await prisma.documents.findFirst({
                    where: { id: documentId, user_id: userId, deleted_at: null }
                });
                if (!existing) {
                    throw new NotFoundException(`Document with ID "${documentId}" not found`);
                }
                return await prisma.documents.update({
                    where: { id: documentId },
                    data: {
                        content,
                        file_url: pdfUrl,
                        is_draft: isDraft,
                        updated_at: new Date()
                    }
                });
            }
            return await prisma.documents.create({
                data: {
                    user_id: userId,
                    template_id: templateId,
                    content,
                    file_url: pdfUrl,
                    is_draft: isDraft
                }
            });

        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }

    async listDocuments(userId) {
        try {
            return await prisma.documents.findMany({
                where: { user_id: userId, deleted_at: null },
                include: {
                    templates: {
                        select: {
                            name: true,
                            description: true
                        }
                    }
                },
                orderBy: { updated_at: 'desc' }
            });
        } catch (error) {
            throw new InternalServerException(error.message);
        }
    }

    async getDocumentById(userId, documentId) {
        try {
            const document = await prisma.documents.findFirst({
                where: { id: documentId, user_id: userId, deleted_at: null },
                include: {
                    templates: true
                }
            });
            if (!document) {
                throw new NotFoundException(`Document with ID "${documentId}" not found`);
            }
            return document;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }

    async deleteDocument(userId, documentId) {
        try {
            const existing = await prisma.documents.findFirst({
                where: { id: documentId, user_id: userId, deleted_at: null }
            });
            if (!existing) {
                throw new NotFoundException(`Document with ID "${documentId}" not found`);
            }
            return await prisma.documents.update({
                where: { id: documentId },
                data: {
                    deleted_at: new Date()
                }
            });
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerException(error.message);
        }
    }
}

export const DocumentService = new Service();
