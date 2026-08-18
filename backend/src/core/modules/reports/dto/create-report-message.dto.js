export const CreateReportMessageDto = body => ({
    message: body.message,
    attachments: body.attachments || null,
});
