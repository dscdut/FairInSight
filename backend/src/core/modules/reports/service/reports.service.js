import crypto from 'crypto';
import { MailerService } from 'core/common/mailer.service';
import { JwtPayload } from 'core/modules/auth/dto/jwt-sign.dto';
import { ReportsRepository } from '../reports.repository';
// import { BcryptService } from './bcrypt.service';
// import { JwtService } from './jwt.service';
import { UnAuthorizedException, DuplicateException, BadRequestException } from '../../../../packages/httpException';
import { DefaultQueryCriteriaDocument } from 'core/common/swagger/reportFilter';

class Service {
    constructor() {
        this.repository = ReportsRepository;
    }

    async listReports(listReportsDto) {
        let allStatus = ["pending", "processing", "resolved"];
        if (allStatus.indexOf(listReportsDto.status) == -1) {
            throw new BadRequestException("Invalid Status value");
        }

        let startDate = listReportsDto.startDate
            ? new Date(listReportsDto.startDate).toISOString()
            : null;
        let endDate = listReportsDto.endDate
            ? new Date(listReportsDto.endDate).toISOString()
            : null;
        
        if (startDate > endDate) {
            throw new BadRequestException("startDate must be before endDate");
        }

        let reports = await this.repository.getReportsByDateAndStatus(listReportsDto.status, startDate, endDate);
        reports = reports.slice((listReportsDto.page - 1) * listReportsDto.limit, listReportsDto.page * listReportsDto.limit);
        return {
            data: {
                items: {
                    reports: reports,
                },
                pagination: {
                    page: listReportsDto.page,
                    limit: listReportsDto.limit,
                    total: reports.length,
                    totalPages: Math.ceil(reports.length / listReportsDto.limit),
                }
            }
        };
    }

    async getReportsStats(getReportsStatsDto) {
        if (getReportsStatsDto.month.length == 0) getReportsStatsDto.month = new Date().now().toISOString().slice(0, 8);
        let year = parseInt(getReportsStatsDto.month.slice(0, 5));
        let month = parseInt(getReportsStatsDto.month.slice(6));
        let startDate = new Date(year + '-' + month + "-01").toISOString();
        year += (month + 1) % 12;
        month = (month + 1) % 12;

        let endDate = new Date(new Date(year + '-' + month + "-01") - 1);

        let reports = await this.repository.getReportsByDate(startDate, endDate);
        let resolvedReports = 0;
        for (let i = 0; i < reports.length; i ++) {
            if (reports[i].status == "RESOLVED") resolvedReports ++;
        }

        return {
            data: {
                month: getReportsStatsDto.month,
                newReports: reports.length,
                resolved: resolvedReports
            }
        };
    }

    async getReportsHistory(getReportsHistoryDto) {
        let reports = await this.repository.getReportsHistory(parseInt(getReportsHistoryDto.page), parseInt(getReportsHistoryDto.limit));
        return {
            data: {
                items: {
                    reports: reports,
                },
                pagination: {
                    page: parseInt(getReportsHistoryDto.page),
                    limit: parseInt(getReportsHistoryDto.limit),
                    total: reports.length,
                    totalPages: Math.ceil(reports.length / parseInt(getReportsHistoryDto.limit)),
                }
            }
        };
    }
}

export const ReportsService = new Service();
