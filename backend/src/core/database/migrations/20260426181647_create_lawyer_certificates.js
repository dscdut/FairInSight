/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    await knex.schema.createTable('lawyer_certificates', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('lawyer_id').references('user_id').inTable('lawyer_details').onDelete('CASCADE');
        
        table.string('certificate_name').notNullable();
        table.text('file_url').notNullable();
        table.string('issued_by').notNullable();
        table.date('issue_date').notNullable();
        
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');
    });  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = knex => knex.schema.dropTable('lawyer_certificates');
