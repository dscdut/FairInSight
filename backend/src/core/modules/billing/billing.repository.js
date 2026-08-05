import prisma from 'core/database';

class Repository {
    listPublicPlans(now = new Date()) {
        return prisma.billing_plans.findMany({
            where: { is_public: true, is_active: true },
            orderBy: [{ sort_order: 'asc' }, { code: 'asc' }],
            include: {
                versions: {
                    where: {
                        is_active: true,
                        starts_at: { lte: now },
                        OR: [{ ends_at: null }, { ends_at: { gt: now } }],
                    },
                    orderBy: { version: 'desc' },
                    take: 1,
                    include: { entitlements: { orderBy: { key: 'asc' } } },
                },
            },
        });
    }

    findActiveSubscription(userId, now = new Date()) {
        return prisma.subscriptions.findFirst({
            where: {
                user_id: userId,
                deleted_at: null,
                status: { in: ['TRIALING', 'ACTIVE'] },
                OR: [{ current_period_end: null }, { current_period_end: { gt: now } }],
            },
            orderBy: [{ current_period_start: 'desc' }, { created_at: 'desc' }],
            include: {
                plan_version: {
                    include: {
                        plans: true,
                        entitlements: { orderBy: { key: 'asc' } },
                    },
                },
            },
        });
    }

    findWallet(userId) {
        return prisma.billing_credit_wallets.findUnique({
            where: { owner_type_owner_id: { owner_type: 'USER', owner_id: userId } },
        });
    }

    listLedger(userId, { cursor, size }) {
        return prisma.billing_credit_ledger.findMany({
            where: { wallet: { owner_type: 'USER', owner_id: userId } },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
            take: size,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            select: {
                id: true,
                entry_type: true,
                amount: true,
                available_after: true,
                reserved_after: true,
                source_ref: true,
                created_at: true,
            },
        });
    }

    listUsage(userId, { cursor, size }) {
        return prisma.billing_ai_usage_events.findMany({
            where: { user_id: userId },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
            take: size,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            select: {
                id: true,
                turn_id: true,
                session_id: true,
                workflow_node: true,
                task_class: true,
                status: true,
                input_tokens: true,
                cached_input_tokens: true,
                output_tokens: true,
                latency_ms: true,
                fallback_used: true,
                billable: true,
                non_billable_reason: true,
                created_at: true,
            },
        });
    }
}

export const BillingRepository = new Repository();
