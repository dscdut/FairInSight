export const UpdateReportStatusDto = body => ({
    status: body.status,
    message: body.message || null,
});
