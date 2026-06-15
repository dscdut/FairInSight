import prisma from 'core/database';
import { NotFoundException, InternalServerException } from 'packages/httpException';
import axios from 'axios';
import mammoth from 'mammoth';

class Service {
    async listLaws({ page = 1, size = 10, filter = {} }) {
        const skip = (page - 1) * size;
        const where = { deleted_at: null };

        if (filter.search) {
            where.OR = [
                { title: { contains: filter.search, mode: 'insensitive' } },
                { document_number: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        if (filter.status && filter.status !== 'ALL') {
            where.status = filter.status;
        }

        if (filter.issuedDate) {
            where.issued_date = new Date(filter.issuedDate);
        }

        const total = await prisma.laws.count({ where });
        const items = await prisma.laws.findMany({
            where,
            skip,
            take: size,
            orderBy: { created_at: 'desc' },
            include: {
                law_versions: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        return {
            items,
            pagination: {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size) || 0
            }
        };
    }

    async getLawById(id) {
        const law = await prisma.laws.findFirst({
            where: { id, deleted_at: null },
            include: {
                law_versions: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        users: {
                            select: {
                                full_name: true
                            }
                        }
                    }
                }
            }
        });

        if (!law) {
            throw new NotFoundException('Không tìm thấy văn bản pháp luật');
        }

        return law;
    }

    async createLaw(payload, userId) {
        const { title, documentNumber, issuedDate, effectiveDate, sourceUrl, officialUrl, content } = payload;

        return prisma.$transaction(async tx => {
            const law = await tx.laws.create({
                data: {
                    title,
                    document_number: documentNumber,
                    issued_date: new Date(issuedDate),
                    effective_date: new Date(effectiveDate),
                    source_url: sourceUrl || '',
                    official_url: officialUrl || '',
                    content,
                    status: 'ACTIVE',
                    user_id: userId,
                }
            });

            const version = await tx.law_versions.create({
                data: {
                    law_id: law.id,
                    version: 'v1',
                    title,
                    content,
                    document_number: documentNumber,
                    issued_date: new Date(issuedDate),
                    effective_date: new Date(effectiveDate),
                    source_url: sourceUrl || '',
                    official_url: officialUrl || '',
                    change_note: 'Khởi tạo văn bản',
                    user_id: userId,
                }
            });

            return {
                ...law,
                law_versions: [version]
            };
        });
    }

    async updateLaw(id, payload, userId) {
        const { title, documentNumber, issuedDate, effectiveDate, sourceUrl, officialUrl, content, changeNote } = payload;

        return prisma.$transaction(async tx => {
            const law = await tx.laws.findUnique({
                where: { id },
                include: { law_versions: true }
            });
            if (!law) {
                throw new NotFoundException('Không tìm thấy văn bản pháp luật');
            }

            const sorted = [...law.law_versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
            const latestVer = sorted[0]?.version || 'v1';
            const num = parseInt(latestVer.replace(/[^\d]/g, ''), 10) || 1;
            const nextVer = `v${num + 1}`;

            await tx.law_versions.create({
                data: {
                    law_id: id,
                    version: nextVer,
                    title,
                    content,
                    document_number: documentNumber,
                    issued_date: new Date(issuedDate),
                    effective_date: new Date(effectiveDate),
                    source_url: (sourceUrl && !sourceUrl.includes('/pdf')) ? sourceUrl : law.source_url,
                    official_url: officialUrl || '',
                    change_note: changeNote || `Cập nhật phiên bản ${nextVer}`,
                    user_id: userId,
                }
            });

            const updatedLaw = await tx.laws.update({
                where: { id },
                data: {
                    title,
                    document_number: documentNumber,
                    issued_date: new Date(issuedDate),
                    effective_date: new Date(effectiveDate),
                    source_url: (sourceUrl && !sourceUrl.includes('/pdf')) ? sourceUrl : law.source_url,
                    official_url: officialUrl || '',
                    content,
                    updated_at: new Date(),
                },
                include: {
                    law_versions: {
                        orderBy: { created_at: 'desc' }
                    }
                }
            });

            return updatedLaw;
        });
    }

    async toggleStatus(id, payload, userId) {
        const { status, reason } = payload;

        return prisma.$transaction(async tx => {
            const law = await tx.laws.findUnique({ where: { id } });
            if (!law) {
                throw new NotFoundException('Không tìm thấy văn bản pháp luật');
            }

            const updatedLaw = await tx.laws.update({
                where: { id },
                data: {
                    status,
                    updated_at: new Date(),
                }
            });

            await tx.law_status_logs.create({
                data: {
                    law_id: id,
                    status,
                    reason: reason || null,
                    user_id: userId,
                }
            });

            return updatedLaw;
        });
    }

    async listVersions(id) {
        const law = await prisma.laws.findUnique({ where: { id } });
        if (!law) {
            throw new NotFoundException('Không tìm thấy văn bản pháp luật');
        }

        return prisma.law_versions.findMany({
            where: { law_id: id },
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: {
                        full_name: true
                    }
                }
            }
        });
    }

    async restoreVersion(id, versionId, userId) {
        return prisma.$transaction(async tx => {
            const law = await tx.laws.findUnique({
                where: { id },
                include: { law_versions: true }
            });
            if (!law) {
                throw new NotFoundException('Không tìm thấy văn bản pháp luật');
            }

            const targetVersion = await tx.law_versions.findUnique({
                where: { id: versionId }
            });
            if (!targetVersion || targetVersion.law_id !== id) {
                throw new NotFoundException('Không tìm thấy phiên bản yêu cầu');
            }

            const sorted = [...law.law_versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
            const latestVer = sorted[0]?.version || 'v1';
            const num = parseInt(latestVer.replace(/[^\d]/g, ''), 10) || 1;
            const nextVer = `v${num + 1}`;

            await tx.law_versions.create({
                data: {
                    law_id: id,
                    version: nextVer,
                    title: targetVersion.title,
                    content: targetVersion.content,
                    document_number: targetVersion.document_number,
                    issued_date: targetVersion.issued_date,
                    effective_date: targetVersion.effective_date,
                    source_url: targetVersion.source_url,
                    official_url: targetVersion.official_url,
                    change_note: `Khôi phục về phiên bản ${targetVersion.version.toUpperCase()}`,
                    user_id: userId,
                }
            });

            const updatedLaw = await tx.laws.update({
                where: { id },
                data: {
                    title: targetVersion.title,
                    content: targetVersion.content,
                    document_number: targetVersion.document_number,
                    issued_date: targetVersion.issued_date,
                    effective_date: targetVersion.effective_date,
                    source_url: targetVersion.source_url,
                    official_url: targetVersion.official_url,
                    updated_at: new Date(),
                },
                include: {
                    law_versions: {
                        orderBy: { created_at: 'desc' }
                    }
                }
            });

            return updatedLaw;
        });
    }

    async parseDocxFromUrl(fileUrl) {
        try {
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            const result = await mammoth.extractRawText({ buffer });
            return {
                text: result.value,
                messages: result.messages
            };
        } catch (error) {
            throw new InternalServerException(`Lỗi trích xuất file Docx: ${error.message}`);
        }
    }
}

export const LawService = new Service();
