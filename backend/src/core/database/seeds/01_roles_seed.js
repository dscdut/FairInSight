/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async (knex) => {
  await knex('roles').del();

  await knex('roles').insert([
    { id: knex.raw('uuid_generate_v4()'), name: 'USER' },
    { id: knex.raw('uuid_generate_v4()'), name: 'LAWYER' },
    { id: knex.raw('uuid_generate_v4()'), name: 'ADMIN' },
  ]);
};
