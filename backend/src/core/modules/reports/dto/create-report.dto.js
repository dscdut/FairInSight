export const CreateReportDto = body => ({
    targetUserId: body.targetUserId || null,
    type: body.type,
    category: body.category,
    customReason: body.customReason || null,
    description: body.description,
    priority: body.priority || 'NORMAL',
    attachments: body.attachments || null,
});
