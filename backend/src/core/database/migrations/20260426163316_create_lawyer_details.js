/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('lawyer_details', table => {
    table.uuid('user_id').primary()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.text('bio');
    table.integer('experience_years');

    table.boolean('is_verified').notNullable().defaultTo(false);
    table.float('rating_avg').defaultTo(0);

    table.decimal('price_per_hour', 10, 2);

    table.specificType('status', 'lawyer_status').notNullable().defaultTo('OFFLINE');

    table.string('bar_association');
    table.string('license_number');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = knex => knex.schema.dropTable('lawyer_details');
