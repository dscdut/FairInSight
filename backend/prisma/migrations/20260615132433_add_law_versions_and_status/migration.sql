-- AlterTable
ALTER TABLE "laws" ADD COLUMN     "official_url" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "law_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "law_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "document_number" VARCHAR(255) NOT NULL,
    "issued_date" DATE NOT NULL,
    "effective_date" DATE NOT NULL,
    "source_url" TEXT NOT NULL,
    "official_url" TEXT,
    "change_note" TEXT,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "law_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "law_status_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "law_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "reason" TEXT,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "law_status_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "law_versions" ADD CONSTRAINT "law_versions_law_id_fkey" FOREIGN KEY ("law_id") REFERENCES "laws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "law_versions" ADD CONSTRAINT "law_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "law_status_logs" ADD CONSTRAINT "law_status_logs_law_id_fkey" FOREIGN KEY ("law_id") REFERENCES "laws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "law_status_logs" ADD CONSTRAINT "law_status_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
