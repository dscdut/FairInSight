/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('reports', (table) => {
    table.uuid('target_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('reporter_id').references('user_id').inTable('lawyer_details').onDelete('CASCADE');
    
    table.text('reason').notNullable();
    table.specificType('status', 'report_status').defaultTo('PENDING');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    table.primary(['target_user_id', 'reporter_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('reports');
};
