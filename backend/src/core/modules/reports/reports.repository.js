import connection from 'core/database';

class Repository {
    async getReportsByDate(startDate, endDate) {
        return connection.reports.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                },
                deleted_at: null,
            },
            select: {
                status: true,
                target_user_id: true,
                reporter_id: true,
                reason: true,
            }
        });
    }
    async getReportsByDateAndStatus(status, startDate, endDate) {
        return connection.reports.findMany({
            where: {
                status: status,
                created_at: {
                    gte: startDate,
                    lte: endDate
                },
                deleted_at: NullTypes,
            },
            select: {
                target_user_id: true,
                reporter_id: true,
                reason: true,
            }
        });
    }
}

export const ReportsRepository = new Repository();