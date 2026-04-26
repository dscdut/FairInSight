/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('email').notNullable();
    table.text('password_hash').notNullable();
    table.string('full_name');

    table.uuid('role_id').references('id').inTable('roles');

    table.text('avatar_url');

    table.string('referral_code', 50);
    table.uuid('referred_by').references('id').inTable('users');

    table.string('phone', 20);
    table.date('date_of_birth');
    table.string('location');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });

  // partial index
  await knex.raw(`
    CREATE UNIQUE INDEX unique_users_email_active
    ON users(email)
    WHERE deleted_at IS NULL;
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX unique_users_referral_active
    ON users(referral_code)
    WHERE deleted_at IS NULL;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = knex => knex.schema.dropTable('users');
