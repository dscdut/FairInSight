-- Additive billing foundation. Existing subscription fields remain available
-- during the compatibility window.
CREATE TYPE "billing_plan_audience" AS ENUM ('INDIVIDUAL', 'ORGANIZATION');
CREATE TYPE "billing_interval" AS ENUM ('MONTH', 'YEAR', 'CUSTOM');
CREATE TYPE "billing_catalog_status" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');
CREATE TYPE "billing_subscription_status" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "billing_owner_type" AS ENUM ('USER', 'ORGANIZATION');
CREATE TYPE "billing_credit_source" AS ENUM ('SUBSCRIPTION', 'PURCHASE', 'ADMIN', 'PROMOTION', 'MIGRATION', 'REFUND');
CREATE TYPE "billing_task_class" AS ENUM ('LOOKUP', 'GUIDED_ANALYSIS', 'DEEP_ANALYSIS', 'DOCUMENT_ANALYSIS', 'DRAFTING', 'HANDOFF_PREP');
CREATE TYPE "billing_reservation_status" AS ENUM ('ACTIVE', 'SETTLED', 'RELEASED', 'EXPIRED');
CREATE TYPE "billing_mode" AS ENUM ('OFF', 'SHADOW', 'ENFORCE');
CREATE TYPE "billing_ledger_entry_type" AS ENUM ('GRANT', 'PURCHASE', 'RESERVE', 'RELEASE', 'CHARGE', 'REFUND', 'EXPIRE', 'ADJUSTMENT');
CREATE TYPE "billing_gateway_turn_status" AS ENUM ('RECEIVED', 'RUNNING', 'COMPLETED', 'WAITING_USER', 'INSUFFICIENT', 'FAILED');

CREATE TABLE "billing_plans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "audience" "billing_plan_audience" NOT NULL DEFAULT 'INDIVIDUAL',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_plans_code_key" UNIQUE ("code")
);

CREATE TABLE "billing_plan_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "plan_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "price_vnd" INTEGER NOT NULL,
    "billing_interval" "billing_interval" NOT NULL,
    "included_credits" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_plan_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_plan_versions_plan_id_version_key" UNIQUE ("plan_id", "version"),
    CONSTRAINT "billing_plan_versions_nonnegative" CHECK ("price_vnd" >= 0 AND "included_credits" >= 0),
    CONSTRAINT "billing_plan_versions_valid_interval" CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at")
);
CREATE INDEX "idx_plan_versions_effective" ON "billing_plan_versions"("plan_id", "is_active", "starts_at", "ends_at");

CREATE OR REPLACE FUNCTION validate_billing_plan_version() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD."is_active"
     AND (NEW."plan_id", NEW."version", NEW."price_vnd", NEW."billing_interval", NEW."included_credits", NEW."starts_at")
         IS DISTINCT FROM
         (OLD."plan_id", OLD."version", OLD."price_vnd", OLD."billing_interval", OLD."included_credits", OLD."starts_at") THEN
    RAISE EXCEPTION 'active billing plan versions are immutable';
  END IF;
  IF NEW."is_active" AND EXISTS (
    SELECT 1 FROM "billing_plan_versions" existing
    WHERE existing."plan_id" = NEW."plan_id"
      AND existing."is_active"
      AND existing."id" <> NEW."id"
      AND tstzrange(existing."starts_at", existing."ends_at", '[)')
          && tstzrange(NEW."starts_at", NEW."ends_at", '[)')
  ) THEN
    RAISE EXCEPTION 'overlapping active billing plan version';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER billing_plan_version_guard
BEFORE INSERT OR UPDATE ON "billing_plan_versions"
FOR EACH ROW EXECUTE FUNCTION validate_billing_plan_version();

CREATE TABLE "billing_plan_entitlements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "plan_version_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value_json" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_plan_entitlements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_plan_entitlements_plan_version_id_key_key" UNIQUE ("plan_version_id", "key")
);

CREATE TABLE "billing_rate_cards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50) NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "billing_catalog_status" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_rate_cards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_rate_cards_code_version_key" UNIQUE ("code", "version"),
    CONSTRAINT "billing_rate_cards_valid_interval" CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at")
);
CREATE INDEX "idx_rate_cards_effective" ON "billing_rate_cards"("status", "starts_at", "ends_at");

CREATE OR REPLACE FUNCTION validate_billing_rate_card() RETURNS trigger AS $$
BEGIN
  IF NEW."status" = 'ACTIVE' AND EXISTS (
    SELECT 1 FROM "billing_rate_cards" existing
    WHERE existing."code" = NEW."code"
      AND existing."status" = 'ACTIVE'
      AND existing."id" <> NEW."id"
      AND tstzrange(existing."starts_at", existing."ends_at", '[)')
          && tstzrange(NEW."starts_at", NEW."ends_at", '[)')
  ) THEN
    RAISE EXCEPTION 'overlapping active billing rate card';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER billing_rate_card_guard
BEFORE INSERT OR UPDATE ON "billing_rate_cards"
FOR EACH ROW EXECUTE FUNCTION validate_billing_rate_card();

CREATE TABLE "billing_rate_card_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rate_card_id" UUID NOT NULL,
    "task_class" "billing_task_class" NOT NULL,
    "estimated_min" INTEGER NOT NULL,
    "estimated_max" INTEGER NOT NULL,
    "units_per_credit" INTEGER NOT NULL,
    "input_weight" INTEGER NOT NULL DEFAULT 1,
    "output_weight" INTEGER NOT NULL DEFAULT 2,
    "cached_weight" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_rate_card_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_rate_card_items_rate_card_id_task_class_key" UNIQUE ("rate_card_id", "task_class"),
    CONSTRAINT "billing_rate_card_items_valid_values" CHECK ("estimated_min" >= 0 AND "estimated_max" >= "estimated_min" AND "units_per_credit" > 0 AND "input_weight" >= 0 AND "output_weight" >= 0 AND "cached_weight" >= 0)
);

CREATE TABLE "billing_credit_wallets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_type" "billing_owner_type" NOT NULL DEFAULT 'USER',
    "owner_id" UUID NOT NULL,
    "available_credits" INTEGER NOT NULL DEFAULT 0,
    "reserved_credits" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_credit_wallets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_credit_wallets_owner_type_owner_id_key" UNIQUE ("owner_type", "owner_id"),
    CONSTRAINT "billing_credit_wallets_nonnegative" CHECK ("available_credits" >= 0 AND "reserved_credits" >= 0)
);

CREATE TABLE "billing_credit_lots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "wallet_id" UUID NOT NULL,
    "source" "billing_credit_source" NOT NULL,
    "granted_amount" INTEGER NOT NULL,
    "remaining_amount" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "source_ref" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_credit_lots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_credit_lots_wallet_id_source_ref_key" UNIQUE ("wallet_id", "source_ref"),
    CONSTRAINT "billing_credit_lots_valid_amount" CHECK ("granted_amount" >= 0 AND "remaining_amount" >= 0 AND "remaining_amount" <= "granted_amount")
);
CREATE INDEX "idx_credit_lots_consumption" ON "billing_credit_lots"("wallet_id", "expires_at", "created_at");

CREATE TABLE "billing_credit_reservations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "wallet_id" UUID NOT NULL,
    "rate_card_id" UUID NOT NULL,
    "turn_id" UUID NOT NULL,
    "task_class" "billing_task_class" NOT NULL,
    "estimated_min" INTEGER NOT NULL,
    "reserved_amount" INTEGER NOT NULL,
    "charged_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "billing_reservation_status" NOT NULL DEFAULT 'ACTIVE',
    "billing_mode" "billing_mode" NOT NULL DEFAULT 'SHADOW',
    "idempotency_key" VARCHAR(255) NOT NULL,
    "payload_digest" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_credit_reservations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_credit_reservations_turn_id_key" UNIQUE ("turn_id"),
    CONSTRAINT "billing_credit_reservations_idempotency_key_key" UNIQUE ("idempotency_key"),
    CONSTRAINT "billing_credit_reservations_valid_amount" CHECK ("estimated_min" >= 0 AND "reserved_amount" >= "estimated_min" AND "charged_amount" >= 0 AND "charged_amount" <= "reserved_amount")
);

CREATE TABLE "billing_credit_ledger" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "wallet_id" UUID NOT NULL,
    "reservation_id" UUID,
    "entry_type" "billing_ledger_entry_type" NOT NULL,
    "amount" INTEGER NOT NULL,
    "available_after" INTEGER NOT NULL,
    "reserved_after" INTEGER NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "source_ref" VARCHAR(255),
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_credit_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_credit_ledger_idempotency_key_key" UNIQUE ("idempotency_key"),
    CONSTRAINT "billing_credit_ledger_balance_nonnegative" CHECK ("available_after" >= 0 AND "reserved_after" >= 0)
);
CREATE INDEX "idx_credit_ledger_wallet_created" ON "billing_credit_ledger"("wallet_id", "created_at", "id");

CREATE TABLE "billing_ai_usage_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "turn_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID,
    "workflow_node" VARCHAR(100) NOT NULL,
    "task_class" "billing_task_class" NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "cached_input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "reasoning_tokens" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "retry_ordinal" INTEGER NOT NULL DEFAULT 0,
    "fallback_used" BOOLEAN NOT NULL DEFAULT false,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "non_billable_reason" VARCHAR(100),
    "rate_card_version" VARCHAR(100) NOT NULL,
    "usage_digest" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_ai_usage_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_ai_usage_events_turn_id_workflow_node_retry_ordinal_usage_digest_key" UNIQUE ("turn_id", "workflow_node", "retry_ordinal", "usage_digest"),
    CONSTRAINT "billing_ai_usage_events_nonnegative" CHECK ("input_tokens" >= 0 AND "cached_input_tokens" >= 0 AND "output_tokens" >= 0 AND "reasoning_tokens" >= 0 AND "latency_ms" >= 0 AND "retry_ordinal" >= 0)
);
CREATE INDEX "idx_usage_events_user_created" ON "billing_ai_usage_events"("user_id", "created_at");

CREATE TABLE "billing_chat_preflights" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "payload_digest" VARCHAR(64) NOT NULL,
    "session_id" UUID,
    "task_class" "billing_task_class" NOT NULL,
    "requested_mode" VARCHAR(20) NOT NULL,
    "estimated_min" INTEGER NOT NULL,
    "estimated_max" INTEGER NOT NULL,
    "confirmation_required" BOOLEAN NOT NULL DEFAULT false,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "reason" VARCHAR(100),
    "rate_card_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_chat_preflights_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_chat_preflights_user_id_idempotency_key_key" UNIQUE ("user_id", "idempotency_key"),
    CONSTRAINT "billing_chat_preflights_valid_estimate" CHECK ("estimated_min" >= 0 AND "estimated_max" >= "estimated_min")
);
CREATE INDEX "idx_chat_preflights_owner_expiry" ON "billing_chat_preflights"("user_id", "expires_at");

CREATE TABLE "billing_chat_turns" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "preflight_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "payload_digest" VARCHAR(64) NOT NULL,
    "session_id" UUID,
    "reservation_id" UUID,
    "status" "billing_gateway_turn_status" NOT NULL DEFAULT 'RECEIVED',
    "response_json" JSONB,
    "error_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_chat_turns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_chat_turns_preflight_id_key" UNIQUE ("preflight_id"),
    CONSTRAINT "billing_chat_turns_reservation_id_key" UNIQUE ("reservation_id"),
    CONSTRAINT "billing_chat_turns_user_id_idempotency_key_key" UNIQUE ("user_id", "idempotency_key")
);
CREATE INDEX "idx_chat_turns_owner_session" ON "billing_chat_turns"("user_id", "session_id", "created_at");

ALTER TABLE "subscriptions"
    ADD COLUMN "plan_version_id" UUID,
    ADD COLUMN "scheduled_plan_version_id" UUID,
    ADD COLUMN "status" "billing_subscription_status" DEFAULT 'ACTIVE',
    ADD COLUMN "current_period_start" TIMESTAMPTZ(6),
    ADD COLUMN "current_period_end" TIMESTAMPTZ(6),
    ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "provider" VARCHAR(50),
    ADD COLUMN "provider_customer_ref" VARCHAR(255),
    ADD COLUMN "provider_subscription_ref" VARCHAR(255);
CREATE INDEX "idx_subscriptions_user_status_period" ON "subscriptions"("user_id", "status", "current_period_end");

ALTER TABLE "billing_plan_versions" ADD CONSTRAINT "billing_plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_plan_entitlements" ADD CONSTRAINT "billing_plan_entitlements_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "billing_plan_versions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_version_id_foreign" FOREIGN KEY ("plan_version_id") REFERENCES "billing_plan_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_scheduled_plan_version_id_foreign" FOREIGN KEY ("scheduled_plan_version_id") REFERENCES "billing_plan_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "billing_rate_card_items" ADD CONSTRAINT "billing_rate_card_items_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "billing_rate_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "billing_credit_lots" ADD CONSTRAINT "billing_credit_lots_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "billing_credit_wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_credit_reservations" ADD CONSTRAINT "billing_credit_reservations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "billing_credit_wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_credit_reservations" ADD CONSTRAINT "billing_credit_reservations_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "billing_rate_cards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_credit_ledger" ADD CONSTRAINT "billing_credit_ledger_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "billing_credit_wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_credit_ledger" ADD CONSTRAINT "billing_credit_ledger_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "billing_credit_reservations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_chat_preflights" ADD CONSTRAINT "billing_chat_preflights_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "billing_rate_cards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_chat_turns" ADD CONSTRAINT "billing_chat_turns_preflight_id_fkey" FOREIGN KEY ("preflight_id") REFERENCES "billing_chat_preflights"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_chat_turns" ADD CONSTRAINT "billing_chat_turns_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "billing_credit_reservations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "billing_ai_usage_events" ADD CONSTRAINT "billing_ai_usage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "billing_chat_preflights" ADD CONSTRAINT "billing_chat_preflights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "billing_chat_turns" ADD CONSTRAINT "billing_chat_turns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Ledger corrections must be compensating rows. Business code cannot mutate or
-- delete an existing accounting event.
CREATE OR REPLACE FUNCTION prevent_billing_ledger_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'billing_credit_ledger is append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER billing_credit_ledger_append_only
BEFORE UPDATE OR DELETE ON "billing_credit_ledger"
FOR EACH ROW EXECUTE FUNCTION prevent_billing_ledger_mutation();
