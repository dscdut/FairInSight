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

    async getReports(getReportsDto) {
        let allStatus = ["pending", "processing", "resolved"];
        if (allStatus.indexOf(getReportsDto.status) == -1) {
            throw new BadRequestException("Invalid Status value");
        }

        let startDate = getReportsDto.startDate
            ? new Date(getReportsDto.startDate).toISOString()
            : null;
        let endDate = getReportsDto.endDate
            ? new Date(getReportsDto.endDate).toISOString()
            : null;
        
        if (startDate > endDate) {
            throw new BadRequestException("startDate must be before endDate");
        }

        let reports = await this.repository.getReportsByDateAndStatus(getReportsDto.status, startDate, endDate);
        reports = reports.slice((getReportsDto.page - 1) * getReportsDto.limit, getReportsDto.page * getReportsDto.limit);
        return {
            data: {
                items: {
                    reports: reports,
                },
                pagination: {
                    page: getReportsDto.page,
                    limit: getReportsDto.limit,
                    total: reports.length,
                    totalPages: reports.length / getReportsDto.limit,
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
}

export const ReportsService = new Service();
