/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('refresh_tokens', table => {
    // PK
    table.uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    // FK user
    table.uuid('user_id')
      .notNullable()
      .unique() // mỗi user 1 token (theo thiết kế của bạn)
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    // token (nên lưu hash)
    table.text('token').notNullable();

    // expire
    table.timestamp('expires_at').notNullable();

    // revoke
    table.boolean('is_revoked').defaultTo(false);

    // timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });

  // unique token nhưng chỉ khi chưa bị delete
  await knex.raw(`
    CREATE UNIQUE INDEX unique_refresh_token_active
    ON refresh_tokens(token)
    WHERE deleted_at IS NULL;
  `);

  // index để query nhanh theo user
  await knex.raw(`
    CREATE INDEX idx_refresh_tokens_user
    ON refresh_tokens(user_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('refresh_tokens');
};
