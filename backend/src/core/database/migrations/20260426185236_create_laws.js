/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('laws', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.text('title').notNullable();
    table.text('content').notNullable();

    table.string('document_number').notNullable();
    table.date('issued_date').notNullable();
    table.date('effective_date').notNullable();
    table.text('source_url').notNullable();

    table.uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = knex => knex.schema.dropTable('laws');
