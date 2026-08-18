import prisma from 'core/database';

const userSelect = {
    id: true,
    full_name: true,
    email: true,
    avatar_url: true,
    lawyer_details: {
        select: {
            user_id: true,
            is_verified: true,
            status: true,
        },
    },
};

const reportInclude = {
    reporter: { select: userSelect },
    target_user: { select: userSelect },
    assigned_admin: { select: userSelect },
    resolver: { select: userSelect },
    messages: {
        where: { deleted_at: null },
        orderBy: { created_at: 'asc' },
        include: {
            sender: { select: userSelect },
        },
    },
};

const listInclude = {
    reporter: { select: userSelect },
    target_user: { select: userSelect },
    assigned_admin: { select: userSelect },
    resolver: { select: userSelect },
    messages: {
        where: { deleted_at: null },
        orderBy: { created_at: 'asc' },
        take: 1,
        include: {
            sender: { select: userSelect },
        },
    },
};

class Repository {
    createReport({ data, initialMessage }) {
        return prisma.reports.create({
            data: {
                ...data,
                messages: {
                    create: initialMessage,
                },
            },
            include: reportInclude,
        });
    }

    list({ where, skip, take }) {
        return prisma.reports.findMany({
            where,
            include: listInclude,
            orderBy: { created_at: 'desc' },
            skip,
            take,
        });
    }

    count(where) {
        return prisma.reports.count({ where });
    }

    findById(id) {
        return prisma.reports.findUnique({
            where: { id },
            include: reportInclude,
        });
    }

    findUserById(id) {
        return prisma.users.findUnique({
            where: { id },
            select: userSelect,
        });
    }

    addMessage({ reportId, senderId, senderRole, message, attachments }) {
        return prisma.$transaction(async tx => {
            await tx.report_messages.create({
                data: {
                    report_id: reportId,
                    sender_id: senderId,
                    sender_role: senderRole,
                    message,
                    attachments,
                },
            });
            return tx.reports.update({
                where: { id: reportId },
                data: { updated_at: new Date() },
                include: reportInclude,
            });
        });
    }

    updateStatus({ reportId, status, adminId, message }) {
        return prisma.$transaction(async tx => {
            const isResolved = status === 'RESOLVED';
            await tx.reports.update({
                where: { id: reportId },
                data: {
                    status,
                    resolved_by: isResolved ? adminId : null,
                    resolved_at: isResolved ? new Date() : null,
                    updated_at: new Date(),
                },
            });

            if (message) {
                await tx.report_messages.create({
                    data: {
                        report_id: reportId,
                        sender_id: adminId,
                        sender_role: 'ADMIN',
                        message,
                    },
                });
            }

            return tx.reports.findUnique({
                where: { id: reportId },
                include: reportInclude,
            });
        });
    }

    countByStatus(where) {
        return prisma.reports.groupBy({
            by: ['status'],
            where,
            _count: { status: true },
        });
    }

    countByType(where) {
        return prisma.reports.groupBy({
            by: ['type'],
            where,
            _count: { type: true },
        });
    }
}

export const ReportsRepository = new Repository();
