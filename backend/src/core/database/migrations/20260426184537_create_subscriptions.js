/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('subscriptions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');

    table.string('plan_name');
    table.timestamp('start_date');
    table.timestamp('end_date');

    table.integer('quota');
    table.boolean('is_active');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });

  await knex.raw(`
    ALTER TABLE subscriptions
    ADD CONSTRAINT check_quota_non_negative CHECK (quota >= 0);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('subscriptions');
};
