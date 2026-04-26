/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('lawyer_specialties', table => {
    table.uuid('lawyer_id')
      .references('user_id').inTable('lawyer_details')
      .onDelete('CASCADE');

    table.uuid('specialty_id')
      .references('id').inTable('specialties')
      .onDelete('CASCADE');

    table.primary(['lawyer_id', 'specialty_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = knex => knex.schema.dropTable('lawyer_specialties');
