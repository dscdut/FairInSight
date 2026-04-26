/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    await knex.schema.createTable('lawyer_experiences', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('lawyer_id').references('user_id').inTable('lawyer_details').onDelete('CASCADE');
        
        table.string('title').notNullable();
        table.text('description').notNullable();
        table.date('start_date').notNullable();
        table.date('end_date');
        
        table.check('end_date IS NULL OR end_date >= start_date');

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');
    });  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = knex => knex.schema.dropTable('lawyer_experiences');
