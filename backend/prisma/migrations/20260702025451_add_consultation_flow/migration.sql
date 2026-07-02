-- CreateEnum
CREATE TYPE "consultation_stage" AS ENUM ('PENDING', 'CHATTING', 'PDF_GENERATION', 'PORTAL_SUBMITTING', 'COMPLETED', 'REVIEWED', 'REJECTED');

-- CreateEnum
CREATE TYPE "communication_channel" AS ENUM ('TEXT_CHAT', 'VOICE_CALL', 'VIDEO_CALL');

-- CreateEnum
CREATE TYPE "submission_type" AS ENUM ('MANUAL', 'PORTAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "chat_request_status" ADD VALUE 'RESCHEDULED';
ALTER TYPE "chat_request_status" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "chat_requests" ADD COLUMN     "advice_summary" TEXT,
ADD COLUMN     "analysis_id" UUID,
ADD COLUMN     "proposed_date" TIMESTAMPTZ(6),
ADD COLUMN     "reschedule_reason" TEXT;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "fields" JSONB;

-- CreateTable
CREATE TABLE "consultation_processes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "lawyer_id" UUID NOT NULL,
    "analysis_id" UUID,
    "current_stage" "consultation_stage" NOT NULL DEFAULT 'PENDING',
    "conversation_id" UUID,
    "submission_method" "submission_type",
    "portal_status" VARCHAR(50),
    "portal_feedback" TEXT,
    "advice_summary" TEXT,
    "pdf_url" TEXT,
    "rating" INTEGER,
    "review_comment" TEXT,
    "template_id" UUID,
    "template_data" JSONB,
    "template_status" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "consultation_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "process_id" UUID NOT NULL,
    "channel" "communication_channel" NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "duration_sec" INTEGER,
    "session_metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chat_requests" ADD CONSTRAINT "chat_requests_analysis_id_foreign" FOREIGN KEY ("analysis_id") REFERENCES "analysis"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultation_processes" ADD CONSTRAINT "consultation_processes_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultation_processes" ADD CONSTRAINT "consultation_processes_lawyer_id_foreign" FOREIGN KEY ("lawyer_id") REFERENCES "lawyer_details"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultation_processes" ADD CONSTRAINT "consultation_processes_analysis_id_foreign" FOREIGN KEY ("analysis_id") REFERENCES "analysis"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultation_processes" ADD CONSTRAINT "consultation_processes_conversation_id_foreign" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_process_id_foreign" FOREIGN KEY ("process_id") REFERENCES "consultation_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
