-- Keep the old composite-key reports table available for manual inspection.
ALTER TABLE IF EXISTS "reports" RENAME TO "reports_legacy";
DO $$
BEGIN
    IF to_regclass('public.reports_legacy') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.reports_legacy'::regclass AND conname = 'reports_pkey') THEN
            ALTER TABLE "reports_legacy" RENAME CONSTRAINT "reports_pkey" TO "reports_legacy_pkey";
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.reports_legacy'::regclass AND conname = 'reports_reporter_id_foreign') THEN
            ALTER TABLE "reports_legacy" RENAME CONSTRAINT "reports_reporter_id_foreign" TO "reports_legacy_reporter_id_foreign";
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.reports_legacy'::regclass AND conname = 'reports_target_user_id_foreign') THEN
            ALTER TABLE "reports_legacy" RENAME CONSTRAINT "reports_target_user_id_foreign" TO "reports_legacy_target_user_id_foreign";
        END IF;
    END IF;
END $$;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status')
       AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_legacy') THEN
        ALTER TYPE "report_status" RENAME TO "report_status_legacy";
    END IF;
END $$;

CREATE TYPE "report_type" AS ENUM ('SYSTEM', 'LAWYER', 'USER');
CREATE TYPE "report_category" AS ENUM (
    'HARASSMENT',
    'UNPROFESSIONAL_BEHAVIOR',
    'FRAUD',
    'TECHNICAL_ERROR',
    'PAYMENT_ERROR',
    'FEATURE_ERROR',
    'OTHER'
);
CREATE TYPE "report_status" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');
CREATE TYPE "report_priority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
CREATE TYPE "report_message_sender_role" AS ENUM ('REPORTER', 'ADMIN', 'SYSTEM');

CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reporter_id" UUID NOT NULL,
    "target_user_id" UUID,
    "type" "report_type" NOT NULL,
    "category" "report_category" NOT NULL,
    "custom_reason" TEXT,
    "description" TEXT NOT NULL,
    "status" "report_status" NOT NULL DEFAULT 'OPEN',
    "priority" "report_priority" NOT NULL DEFAULT 'NORMAL',
    "assigned_admin_id" UUID,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "report_id" UUID NOT NULL,
    "sender_id" UUID,
    "sender_role" "report_message_sender_role" NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "report_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");
CREATE INDEX "reports_target_user_id_idx" ON "reports"("target_user_id");
CREATE INDEX "reports_status_idx" ON "reports"("status");
CREATE INDEX "reports_type_idx" ON "reports"("type");
CREATE INDEX "report_messages_report_id_idx" ON "report_messages"("report_id");
CREATE INDEX "report_messages_sender_id_idx" ON "report_messages"("sender_id");

ALTER TABLE "reports"
    ADD CONSTRAINT "reports_reporter_id_foreign"
    FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "reports"
    ADD CONSTRAINT "reports_target_user_id_foreign"
    FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "reports"
    ADD CONSTRAINT "reports_assigned_admin_id_foreign"
    FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "reports"
    ADD CONSTRAINT "reports_resolved_by_foreign"
    FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "report_messages"
    ADD CONSTRAINT "report_messages_report_id_foreign"
    FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "report_messages"
    ADD CONSTRAINT "report_messages_sender_id_foreign"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
