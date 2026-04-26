/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE lawyer_status AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE ai_role AS ENUM ('USER', 'AI');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE chat_request_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.raw(`DROP TYPE IF EXISTS chat_request_status`);
  await knex.raw(`DROP TYPE IF EXISTS ai_role`);
  await knex.raw(`DROP TYPE IF EXISTS report_status`);
  await knex.raw(`DROP TYPE IF EXISTS lawyer_status`);
};
