/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    await knex.schema.createTable('ratings', (table) => {
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('lawyer_id').references('user_id').inTable('lawyer_details').onDelete('CASCADE');
        
        table.integer('rating').notNullable().checkBetween([1, 5]);
        table.text('comment').notNullable();
        
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');

        table.primary(['user_id', 'lawyer_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
    await knex.schema.dropTable('ratings');
};
