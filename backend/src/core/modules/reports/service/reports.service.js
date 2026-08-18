import { BadRequestException, NotFoundException } from 'packages/httpException';
import { ForbiddenException } from 'packages/httpException/ForbiddenException';
import { Role } from 'core/rules';
import { ReportsRepository } from '../reports.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REPORT_TYPES = new Set(['SYSTEM', 'LAWYER', 'USER']);
const REPORT_CATEGORIES = new Set([
    'HARASSMENT',
    'UNPROFESSIONAL_BEHAVIOR',
    'FRAUD',
    'TECHNICAL_ERROR',
    'PAYMENT_ERROR',
    'FEATURE_ERROR',
    'OTHER',
]);
const REPORT_STATUSES = new Set(['OPEN', 'IN_REVIEW', 'RESOLVED']);
const REPORT_PRIORITIES = new Set(['LOW', 'NORMAL', 'HIGH']);

const asArray = value => (Array.isArray(value) ? value : [value]).filter(Boolean);

const isAdmin = user => {
    const roles = asArray(user?.roles ?? user?.role);
    return roles.includes(Role.ADMIN.name);
};

const assertUuid = (value, field) => {
    if (!UUID_RE.test(String(value || ''))) {
        throw new BadRequestException(`${field} must be a valid UUID`);
    }
};

const normalizeEnum = (value, values, field) => {
    if (!value) return undefined;
    const normalized = String(value).trim().toUpperCase();
    if (normalized === 'ALL') return undefined;
    if (!values.has(normalized)) {
        throw new BadRequestException(`${field} is invalid`);
    }
    return normalized;
};

const parseDate = (value, field) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`${field} must be a valid date`);
    }
    return date;
};

const parseMonthRange = month => {
    const value = month || new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(value)) {
        throw new BadRequestException('month must use YYYY-MM format');
    }

    const start = new Date(`${value}-01T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
        throw new BadRequestException('month must be a valid month');
    }

    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return { month: value, start, end };
};

const buildDateFilter = ({ startDate, endDate }) => {
    const start = parseDate(startDate, 'startDate');
    const end = parseDate(endDate, 'endDate');
    if (start && end && start > end) {
        throw new BadRequestException('startDate must be before or equal to endDate');
    }
    return (start || end) ? {
        created_at: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
        },
    } : {};
};

const mapUser = user => user ? ({
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    isLawyer: Boolean(user.lawyer_details),
    lawyerStatus: user.lawyer_details?.status || null,
    lawyerVerified: user.lawyer_details?.is_verified || false,
}) : null;

const mapMessage = message => ({
    id: message.id,
    reportId: message.report_id,
    senderId: message.sender_id,
    senderRole: message.sender_role,
    message: message.message,
    attachments: message.attachments || null,
    createdAt: message.created_at,
    sender: mapUser(message.sender),
});

const mapReport = report => ({
    id: report.id,
    reporterId: report.reporter_id,
    targetUserId: report.target_user_id,
    type: report.type,
    category: report.category,
    customReason: report.custom_reason,
    description: report.description,
    status: report.status,
    priority: report.priority,
    assignedAdminId: report.assigned_admin_id,
    resolvedBy: report.resolved_by,
    resolvedAt: report.resolved_at,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    reporter: mapUser(report.reporter),
    targetUser: mapUser(report.target_user),
    assignedAdmin: mapUser(report.assigned_admin),
    resolver: mapUser(report.resolver),
    messages: (report.messages || []).map(mapMessage),
    messageCount: report._count?.messages ?? report.messages?.length ?? 0,
});

class Service {
    constructor() {
        this.repository = ReportsRepository;
    }

    async #assertTarget(dto, reporterId) {
        if (dto.type === 'SYSTEM') {
            if (dto.targetUserId) {
                throw new BadRequestException('SYSTEM report must not include targetUserId');
            }
            return null;
        }

        if (!dto.targetUserId) {
            throw new BadRequestException('targetUserId is required for USER or LAWYER reports');
        }
        assertUuid(dto.targetUserId, 'targetUserId');

        if (dto.targetUserId === reporterId) {
            throw new BadRequestException('You cannot report yourself');
        }

        const target = await this.repository.findUserById(dto.targetUserId);
        if (!target) {
            throw new NotFoundException('Target user not found');
        }
        if (dto.type === 'LAWYER' && !target.lawyer_details) {
            throw new BadRequestException('Target user is not a lawyer');
        }
        return target;
    }

    #buildWhere({ user, filters = {}, ownerScoped = true }) {
        const where = {
            deleted_at: null,
            ...(ownerScoped && !isAdmin(user) ? { reporter_id: user.id } : {}),
            ...buildDateFilter(filters),
        };

        const status = normalizeEnum(filters.status, REPORT_STATUSES, 'status');
        const type = normalizeEnum(filters.type, REPORT_TYPES, 'type');
        const category = normalizeEnum(filters.category, REPORT_CATEGORIES, 'category');
        const priority = normalizeEnum(filters.priority, REPORT_PRIORITIES, 'priority');
        if (status) where.status = status;
        if (type) where.type = type;
        if (category) where.category = category;
        if (priority) where.priority = priority;

        const search = String(filters.search || '').trim();
        if (search) {
            where.OR = [
                { description: { contains: search } },
                { custom_reason: { contains: search } },
            ];
        }
        return where;
    }

    async createReport({ user, dto }) {
        const reporterId = user.id;
        normalizeEnum(dto.type, REPORT_TYPES, 'type');
        normalizeEnum(dto.category, REPORT_CATEGORIES, 'category');
        normalizeEnum(dto.priority, REPORT_PRIORITIES, 'priority');

        if (dto.category === 'OTHER' && !String(dto.customReason || '').trim()) {
            throw new BadRequestException('customReason is required when category is OTHER');
        }

        await this.#assertTarget(dto, reporterId);

        const report = await this.repository.createReport({
            data: {
                reporter_id: reporterId,
                target_user_id: dto.targetUserId,
                type: dto.type,
                category: dto.category,
                custom_reason: dto.customReason,
                description: dto.description,
                priority: dto.priority,
            },
            initialMessage: {
                sender_id: reporterId,
                sender_role: 'REPORTER',
                message: dto.description,
                attachments: dto.attachments,
            },
        });

        return { data: mapReport(report) };
    }

    async listReports({ user, page, size, filters }) {
        const where = this.#buildWhere({ user, filters, ownerScoped: true });
        const skip = (page - 1) * size;
        const [items, total] = await Promise.all([
            this.repository.list({ where, skip, take: size }),
            this.repository.count(where),
        ]);

        return {
            data: {
                items: items.map(mapReport),
                pagination: {
                    page,
                    size,
                    total,
                    totalPages: Math.ceil(total / size) || 0,
                },
            },
        };
    }

    async getReportById({ user, id }) {
        assertUuid(id, 'id');
        const report = await this.repository.findById(id);
        if (!report || report.deleted_at) {
            throw new NotFoundException('Report not found');
        }
        if (!isAdmin(user) && report.reporter_id !== user.id) {
            throw new ForbiddenException('You do not have permission to view this report');
        }
        return { data: mapReport(report) };
    }

    async createReportMessage({ user, reportId, dto }) {
        const { data: report } = await this.getReportById({ user, id: reportId });
        if (report.status === 'RESOLVED') {
            throw new BadRequestException('Resolved report cannot receive new messages');
        }

        const updated = await this.repository.addMessage({
            reportId,
            senderId: user.id,
            senderRole: isAdmin(user) ? 'ADMIN' : 'REPORTER',
            message: dto.message,
            attachments: dto.attachments,
        });
        return { data: mapReport(updated) };
    }

    async updateReportStatus({ user, reportId, dto }) {
        normalizeEnum(dto.status, REPORT_STATUSES, 'status');
        const report = await this.repository.findById(reportId);
        if (!report || report.deleted_at) {
            throw new NotFoundException('Report not found');
        }
        const updated = await this.repository.updateStatus({
            reportId,
            status: dto.status,
            adminId: user.id,
            message: dto.message,
        });
        return { data: mapReport(updated) };
    }

    async getReportsStats({ month }) {
        const range = parseMonthRange(month);
        const where = {
            deleted_at: null,
            created_at: {
                gte: range.start,
                lt: range.end,
            },
        };

        const [total, byStatus, byType] = await Promise.all([
            this.repository.count(where),
            this.repository.countByStatus(where),
            this.repository.countByType(where),
        ]);

        const statusCounts = byStatus.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
        }, {});
        const typeCounts = byType.reduce((acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
        }, {});

        return {
            data: {
                month: range.month,
                total,
                open: statusCounts.OPEN || 0,
                inReview: statusCounts.IN_REVIEW || 0,
                resolved: statusCounts.RESOLVED || 0,
                system: typeCounts.SYSTEM || 0,
                lawyer: typeCounts.LAWYER || 0,
                user: typeCounts.USER || 0,
            },
        };
    }
}

export const ReportsService = new Service();
